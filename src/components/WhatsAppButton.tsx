import { useState, useEffect, memo } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const WhatsAppButton = memo(function WhatsAppButton() {
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        fetchWhatsAppNumber();

        // Show tooltip after 5 seconds if user hasn't interacted
        const timer = setTimeout(() => {
            if (!hasInteracted) {
                setIsTooltipOpen(true);
                // Auto-hide after 5 seconds
                setTimeout(() => setIsTooltipOpen(false), 5000);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [hasInteracted]);

    const fetchWhatsAppNumber = async () => {
        try {
            const { data } = await supabase
                .from('settings')
                .select('value')
                .eq('key', 'contact_phone')
                .single();

            if (data?.value) {
                // Clean the phone number - remove spaces and special chars
                const cleanNumber = String(data.value).replace(/[\s()+-]/g, '');
                setWhatsappNumber(cleanNumber);
            }
        } catch (error) {
            console.error('Error fetching WhatsApp number:', error);
        }
    };

    const handleClick = () => {
        setHasInteracted(true);
        setIsTooltipOpen(false);

        if (whatsappNumber) {
            // Create WhatsApp message
            const message = encodeURIComponent('Hi! I have a question about KAIZEN 2025.');
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleTooltipClose = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsTooltipOpen(false);
        setHasInteracted(true);
    };

    if (!whatsappNumber) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Tooltip */}
            {isTooltipOpen && (
                <div className="absolute bottom-full right-0 mb-3 animate-fade-in">
                    <div className="relative bg-white text-gray-800 rounded-lg shadow-xl p-4 min-w-[240px]">
                        <button
                            onClick={handleTooltipClose}
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <p className="font-semibold text-sm mb-1">Need help? 👋</p>
                        <p className="text-xs text-gray-600">
                            Chat with us on WhatsApp for quick answers about registrations & events!
                        </p>
                        {/* Arrow */}
                        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white transform rotate-45" />
                    </div>
                </div>
            )}

            {/* WhatsApp Button */}
            <button
                onClick={handleClick}
                className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] hover:bg-[#20BD5A] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                aria-label="Chat on WhatsApp"
            >
                {/* Pulse animation ring */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />

                {/* Icon */}
                <MessageCircle className="w-7 h-7 text-white" />

                {/* Hover label */}
                <span className="absolute right-full mr-3 whitespace-nowrap bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    Chat with us
                </span>
            </button>
        </div>
    );
});
