import { FiMail, FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

const socials = [
  { Icon: FiMail,       href: 'mailto:Huraira735@gmail.com', label: 'Email' },
  { Icon: FiFacebook,   href: 'https://facebook.com',       label: 'Facebook' },
  { Icon: FiInstagram,  href: 'https://instagram.com',      label: 'Instagram' },
  { Icon: FaWhatsapp,   href: 'https://wa.me/918655787075', label: 'WhatsApp' },
  { Icon: FiYoutube,    href: 'https://youtube.com',        label: 'YouTube' },
];

export default function FollowUs({ dark = false }) {
  return (
    <div>
      <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'} mb-3`}>Follow us</h3>
      <div className="flex flex-wrap gap-2">
        {socials.map(({ Icon, href, label }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition
              ${dark
                ? 'bg-gray-800 text-gray-200 hover:bg-primary-500 hover:text-white'
                : 'bg-gray-200 text-gray-800 hover:bg-primary-500 hover:text-white'}`}
          >
            <Icon size={16} />
          </a>
        ))}
      </div>
    </div>
  );
}
