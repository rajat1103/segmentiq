import { FiBell } from "react-icons/fi";

function NotificationBell() {
  return (

    <button
      className="
      relative
      p-3
      rounded-xl
      bg-slate-100
      hover:bg-slate-200
      transition
    "
    >

      <FiBell size={22} />

      <span
        className="
        absolute
        top-2
        right-2
        w-2
        h-2
        rounded-full
        bg-red-500
      "
      />

    </button>

  );
}

export default NotificationBell;