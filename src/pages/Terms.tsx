import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContactFooter } from '@/components/ContactFooter';

export default function Terms() {

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-foreground">Terms & Conditions</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using this event management portal, you accept and agree to be bound by these Terms and
              Conditions. If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Event Registration</h2>
            <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Eligibility</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participants must be currently enrolled students</li>
              <li>Valid college ID may be required for verification</li>
              <li>Age restrictions may apply for certain events</li>
              <li>Participants must provide accurate information during registration</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">2.2 Registration Process</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registration is confirmed only after payment (if applicable)</li>
              <li>Limited slots are available on a first-come, first-served basis</li>
              <li>Incomplete registrations will not be processed</li>
              <li>Team registrations require all member details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Payment Terms</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Registration fees are non-refundable except as specified in our refund policy</li>
              <li>All prices are in Indian Rupees (INR) unless otherwise stated</li>
              <li>Payment must be completed within the specified timeframe</li>
              <li>Failed or incomplete payments will result in registration cancellation</li>
              <li>We are not responsible for bank charges or payment gateway fees</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Event Participation</h2>
            <h3 className="text-xl font-semibold text-foreground mb-3">4.1 Code of Conduct</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participants must maintain respectful and professional behavior</li>
              <li>Harassment, discrimination, or misconduct will not be tolerated</li>
              <li>Follow all event-specific rules and guidelines</li>
              <li>Respect event coordinators and fellow participants</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">4.2 Attendance</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participants must arrive on time for events</li>
              <li>Late arrivals may result in disqualification</li>
              <li>Proxy attendance is strictly prohibited</li>
              <li>Valid ID proof must be presented when requested</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cancellation and Modifications</h2>
            <h3 className="text-xl font-semibold text-foreground mb-3">5.1 By Organizers</h3>
            <p>We reserve the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancel, postpone, or modify events due to unforeseen circumstances</li>
              <li>Change event venues, dates, or timings with prior notice</li>
              <li>Modify event rules and regulations</li>
              <li>Refuse or cancel registrations for valid reasons</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-4">5.2 By Participants</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Cancellation requests must be submitted in writing</li>
              <li>Refunds are subject to our refund policy</li>
              <li>Transfer of registrations may be allowed with prior approval</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All content on this platform is protected by copyright</li>
              <li>Event materials and resources are for personal use only</li>
              <li>Participants grant us rights to use event photos/videos for promotional purposes</li>
              <li>Unauthorized reproduction or distribution is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Liability and Disclaimers</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Participants attend events at their own risk</li>
              <li>We are not liable for personal injuries, loss, or damage</li>
              <li>Participants are responsible for their personal belongings</li>
              <li>We do not guarantee event outcomes or experiences</li>
              <li>Technical issues or system downtime may occur without liability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Privacy and Data Protection</h2>
            <p>
              Your personal information is handled according to our Privacy Policy. By using our services, you consent to the
              collection and use of your information as described in the Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Dispute Resolution</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All disputes will be resolved through mutual discussion first</li>
              <li>Unresolved disputes will be subject to arbitration</li>
              <li>The jurisdiction for legal matters is [Your City/State]</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Information</h2>
            <p>
              For questions regarding these terms and conditions, please contact us through our contact form or at the email
              address provided on our website.
            </p>
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
