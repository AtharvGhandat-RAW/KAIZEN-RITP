import { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { ContactFooter } from '@/components/ContactFooter';

export default function Privacy() {

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-foreground">Privacy Policy</h1>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <p>We collect information that you provide directly to us when registering for events, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name and email address</li>
              <li>Phone number</li>
              <li>College name, year, and branch</li>
              <li>Team information (if applicable)</li>
              <li>Payment information (processed securely through third-party payment processors)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process event registrations and payments</li>
              <li>Communicate event updates and important information</li>
              <li>Manage team formations and event logistics</li>
              <li>Improve our services and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Security</h2>
            <p>
              We implement appropriate technical and organizational security measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure database storage with row-level security</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in
              the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>With event coordinators for event management purposes</li>
              <li>With payment processors to complete transactions</li>
              <li>When required by law or legal process</li>
              <li>To protect our rights and safety</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Cookies and Tracking</h2>
            <p>
              We use essential cookies and local storage to maintain your session and improve user experience. We do not use
              third-party tracking cookies for advertising purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy
              policy, unless a longer retention period is required by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy
              on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Contact Us</h2>
            <p>
              If you have any questions about this privacy policy or your personal information, please contact us through our
              contact form or at the email address provided on our website.
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
