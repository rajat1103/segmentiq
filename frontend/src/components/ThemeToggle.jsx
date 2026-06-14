import { FiMoon } from "react-icons/fi";

function ThemeToggle() {
  return (

    <button
      className="
      p-3
      rounded-xl
      bg-slate-100
      hover:bg-slate-200
      transition
    "
    >

      <FiMoon size={22} />

    </button>

  );
}

export default ThemeToggle;