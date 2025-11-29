import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContactFooter } from '@/components/ContactFooter';

export default function Refund() {

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-foreground">Refund Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. General Refund Policy</h2>
            <p>
              We understand that circumstances may change after registration. Our refund policy is designed to be fair to both
              participants and organizers while accounting for event planning commitments.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Refund Eligibility</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Full Refund (100%)</h3>
            <p>You are eligible for a full refund if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The event is cancelled by organizers</li>
              <li>Cancellation request is made within 24 hours of registration</li>
              <li>You are unable to attend due to event rescheduling (if new date conflicts)</li>
              <li>Your registration is rejected by organizers</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">2.2 Partial Refund (50%)</h3>
            <p>You may receive a 50% refund if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellation is made 7 days or more before the event</li>
              <li>Medical emergency with valid documentation</li>
              <li>Academic commitments (exams) with proof</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">2.3 No Refund</h3>
            <p>Refunds will NOT be provided if:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellation is made less than 7 days before the event</li>
              <li>Participant fails to attend without prior notice</li>
              <li>Participant is disqualified due to misconduct</li>
              <li>Registration fee is marked as non-refundable for the event</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Refund Process</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">3.1 How to Request a Refund</h3>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Submit a refund request through our contact form or email</li>
              <li>Include your registration details (name, event, registration ID)</li>
              <li>Provide reason for refund and supporting documentation if applicable</li>
              <li>Wait for confirmation from our team</li>
            </ol>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">3.2 Processing Time</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Refund requests are reviewed within 2-3 business days</li>
              <li>Approved refunds are processed within 7-10 business days</li>
              <li>Refunds are credited to the original payment method</li>
              <li>Bank processing may take additional 3-5 business days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Event-Specific Policies</h2>
            <p>
              Some events may have specific refund policies due to their nature or requirements. These will be clearly
              mentioned on the event page during registration. Event-specific policies take precedence over general policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Payment Gateway Charges</h2>
            <p>
              Please note that payment gateway charges (typically 2-3% of transaction amount) are non-refundable and will be
              deducted from the refund amount. This is a third-party charge beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Team Registrations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Team refunds require consensus from team leader</li>
              <li>Partial team withdrawals may not be eligible for refunds</li>
              <li>Individual team member changes may be allowed without refund</li>
              <li>Team size changes subject to event rules</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Free Events</h2>
            <p>
              For free events (no registration fee), cancellation can be done anytime before the event. However, repeated
              no-shows may result in restrictions on future registrations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Force Majeure</h2>
            <p>
              In case of force majeure events (natural disasters, pandemics, government restrictions, etc.) causing event
              cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full refunds or event credits will be provided</li>
              <li>Option to transfer registration to rescheduled event</li>
              <li>Communication will be sent to all registered participants</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Disputes and Appeals</h2>
            <p>
              If you disagree with a refund decision, you may appeal by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Sending a detailed appeal with supporting evidence</li>
              <li>Appeals reviewed within 5 business days</li>
              <li>Final decision communicated via email</li>
              <li>Management decision is final and binding</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact for Refunds</h2>
            <p>
              For refund requests or queries, please contact us through:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact form on our website</li>
              <li>Email (provided on contact page)</li>
              <li>Include all relevant registration details</li>
            </ul>
          </section>

          <p className="text-sm text-muted-foreground mt-8">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </main>

      <ContactFooter />
    </div>
  );
}
