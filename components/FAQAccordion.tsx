'use client';

import { ChevronDown } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

export default function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <details
          key={index}
          open={openIndex === index}
          onToggle={(e) => {
            const isOpen = e.target.open;
            setOpenIndex(isOpen ? index : null);
          }}
          className="border border-hair rounded-lg overflow-hidden"
        >
          <summary className="font-display text-lg px-6 py-4 cursor-pointer hover:bg-brass/5 transition-colors list-none">
            {item.q}
            <ChevronDown
              className={`w-5 h-5 float-right text-mist transition-transform ${
                openIndex === index ? 'rotate-180' : ''
              }`}
            />
          </summary>
          <div className="px-6 pb-4">
            <p className="text-sm text-bone/70 leading-relaxed">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
