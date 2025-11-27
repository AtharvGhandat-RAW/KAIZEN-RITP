import { memo, useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
    {
        question: "How do I register for KAIZEN 2025?",
        answer: "Click on 'Register Now' button in the navigation or hero section. Fill in your details, select your events, and complete the payment. You'll receive a confirmation email with your registration details."
    },
    {
        question: "Can I register as a team?",
        answer: "Yes! Many events allow team registrations. During registration, you can add team members by providing their names and emails. Team size limits vary by event."
    },
    {
        question: "What payment methods are accepted?",
        answer: "We accept UPI, debit/credit cards, and net banking. After completing the payment, upload your payment screenshot during registration."
    },
    {
        question: "How do I check my registration status?",
        answer: "Click on 'Check Status' in the navigation bar. Enter your email or phone number to view all your registrations and their verification status."
    },
    {
        question: "I haven't received a confirmation. What should I do?",
        answer: "First, check your spam folder. If you still haven't received it, use the 'Check Status' feature to verify your registration. If issues persist, contact us via WhatsApp or email."
    },
    {
        question: "Can I cancel my registration and get a refund?",
        answer: "Refund policies vary based on timing. Please check our Refund Policy page or contact our support team for assistance with cancellations."
    },
    {
        question: "Do I need to bring anything on event day?",
        answer: "Yes, please bring a valid college ID and your registration confirmation (email or screenshot). Some technical events may have specific requirements mentioned in the event details."
    },
    {
        question: "Is there on-spot registration available?",
        answer: "Limited on-spot registrations may be available based on event capacity. We recommend pre-registering to secure your spot as popular events fill up quickly."
    }
];

export const FAQSection = memo(function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/5 to-transparent pointer-events-none" />

            <div className="max-w-3xl mx-auto relative">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
                        <HelpCircle className="w-4 h-4 text-red-500" />
                        <span className="text-red-400 text-sm font-medium">Got Questions?</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-white/60 max-w-xl mx-auto">
                        Find quick answers to common questions about registration, events, and more.
                    </p>
                </div>

                {/* FAQ Items */}
                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-black/40 border border-white/10 rounded-lg overflow-hidden hover:border-red-500/30 transition-colors"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
                            >
                                <span className="text-white font-medium pr-4">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 text-red-500 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-white/70 text-sm leading-relaxed">
                                    {faq.answer}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Still have questions */}
                <div className="mt-10 text-center p-6 bg-gradient-to-r from-red-500/10 via-red-600/10 to-red-500/10 rounded-xl border border-red-500/20">
                    <p className="text-white/80 mb-3">
                        Still have questions? We're here to help!
                    </p>
                    <p className="text-white/60 text-sm">
                        Contact us via WhatsApp or drop us an email at{' '}
                        <a href="mailto:info@kaizentechfest.com" className="text-red-400 hover:text-red-300 transition-colors">
                            info@kaizentechfest.com
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
});
