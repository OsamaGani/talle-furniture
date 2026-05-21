import { FiMail, FiFacebook, FiInstagram, FiYoutube } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import {
  EMAIL_PRIMARY, INSTAGRAM_URL, FACEBOOK_URL, YOUTUBE_URL,
  PHONE_PRIMARY_WHATSAPP, mailtoLink,
} from '../config/contact';

// Hide any social icon whose URL is still a bare homepage / placeholder
// (e.g. https://youtube.com without a channel handle). Keeps the user
// from landing on YouTube's front page if they click. Update the URL
// in config/contact.js when a real channel exists and it auto-shows.
const isPlaceholder = (url) =>
  /^https?:\/\/(www\.)?(youtube|facebook|instagram|twitter|x|tiktok|linkedin|pinterest|threads)\.com\/?$/i.test(url);

// All URLs/handles come from config/contact.js so updating Instagram /
// Facebook / YouTube / WhatsApp / email in one place updates the
// footer, contact page, and every other social-icon set on the site.
const socials = [
  { Icon: FiMail,       href: mailtoLink(EMAIL_PRIMARY),            label: 'Email' },
  { Icon: FiFacebook,   href: FACEBOOK_URL,                         label: 'Facebook' },
  { Icon: FiInstagram,  href: INSTAGRAM_URL,                        label: 'Instagram' },
  { Icon: FaWhatsapp,   href: `https://wa.me/${PHONE_PRIMARY_WHATSAPP}`, label: 'WhatsApp' },
  { Icon: FiYoutube,    href: YOUTUBE_URL,                          label: 'YouTube' },
].filter((s) => !isPlaceholder(s.href));

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
