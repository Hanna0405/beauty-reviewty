import { FaInstagram, FaTiktok, FaFacebook } from "react-icons/fa";

export default function SocialBar() {
 return (
 <div className="mt-10 flex items-center justify-center gap-6">
 {/* Instagram */}
 <a
 href="#"
 target="_blank"
 rel="noopener noreferrer"
 aria-label="Instagram"
 className="text-3xl text-gray-500 transition hover:text-pink-600"
 >
 <FaInstagram />
 </a>

 {/* TikTok */}
 <a
 href="#"
 target="_blank"
 rel="noopener noreferrer"
 aria-label="TikTok"
 className="text-3xl text-gray-500 transition hover:text-pink-600"
 >
 <FaTiktok />
 </a>

 {/* Facebook */}
 <a
 href="#"
 target="_blank"
 rel="noopener noreferrer"
 aria-label="Facebook"
 className="text-3xl text-gray-500 transition hover:text-pink-600"
 >
 <FaFacebook />
 </a>
 </div>
 );
}
