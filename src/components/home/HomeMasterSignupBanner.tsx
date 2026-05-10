import Link from "next/link";
import { MdPersonAddAlt1 } from "react-icons/md";

export default function HomeMasterSignupBanner() {
  return (
    <div className="rounded-2xl border border-pink-100/70 bg-white/75 px-3.5 py-3 flex flex-row items-center gap-3 justify-between shadow-sm">
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold text-[15px] text-gray-900 leading-snug">
          Are you a beauty master?
        </p>
        <p className="mt-1 text-[12px] text-gray-800 leading-snug">
          Create your <span className="font-semibold text-pink-600">FREE</span>{" "}
          profile today!
        </p>
      </div>
      <Link
        href="/signup?role=master"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-pink-500 bg-pink-500 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-pink-600"
      >
        Join Now
        <MdPersonAddAlt1 className="text-lg opacity-95" aria-hidden />
      </Link>
    </div>
  );
}
