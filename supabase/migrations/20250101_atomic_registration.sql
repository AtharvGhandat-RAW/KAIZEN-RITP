-- Function to handle atomic registration
create or replace function register_user_for_event(
  p_full_name text,
  p_email text,
  p_phone text,
  p_college text,
  p_year text,
  p_branch text,
  p_event_id uuid,
  p_team_name text,
  p_payment_proof_url text,
  p_registration_fee numeric
) returns json as $$
declare
  v_profile_id uuid;
  v_team_id uuid;
  v_registration_id uuid;
  v_existing_status text;
begin
  -- 1. Handle Profile (Upsert)
  select id into v_profile_id from profiles where email = p_email;
  
  if v_profile_id is null then
    insert into profiles (full_name, email, phone, college, year, branch)
    values (p_full_name, p_email, p_phone, p_college, p_year, p_branch)
    returning id into v_profile_id;
  else
    update profiles 
    set full_name = p_full_name, phone = p_phone, college = p_college, year = p_year, branch = p_branch
    where id = v_profile_id;
  end if;

  -- 2. Check Existing Registration
  select payment_status into v_existing_status 
  from registrations 
  where profile_id = v_profile_id and event_id = p_event_id;

  if v_existing_status is not null then
    if v_existing_status = 'rejected' then
      delete from registrations where profile_id = v_profile_id and event_id = p_event_id;
    else
      RAISE EXCEPTION 'Already registered or pending verification.';
    end if;
  end if;

  -- 3. Handle Team (if applicable)
  if p_team_name is not null and p_team_name != '' then
    insert into teams (name, event_id, leader_id)
    values (p_team_name, p_event_id, v_profile_id)
    returning id into v_team_id;
  end if;

  -- 4. Create Registration
  insert into registrations (
    profile_id, event_id, team_id, registration_type, payment_status, payment_proof_url
  ) values (
    v_profile_id, 
    p_event_id, 
    v_team_id, 
    case when v_team_id is not null then 'team' else 'solo' end,
    case when p_registration_fee = 0 then 'completed' else 'pending' end,
    p_payment_proof_url
  ) returning id into v_registration_id;

  return json_build_object('success', true, 'registration_id', v_registration_id);
exception when others then
  RAISE EXCEPTION '%', SQLERRM;
end;
$$ language plpgsql security definer;
