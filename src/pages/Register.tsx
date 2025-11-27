import { useNavigate } from 'react-router-dom';
import { RegistrationPage } from '@/components/RegistrationPage';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black relative">
      <AtmosphericBackground />
      <div className="relative z-10 pt-20 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          <RegistrationPage onClose={() => navigate('/')} />
        </div>
      </div>
    </div>
  );
}
