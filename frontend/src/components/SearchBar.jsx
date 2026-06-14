import { FiSearch } from "react-icons/fi";

function SearchBar() {
  return (
    <div className="relative">

      <FiSearch
        className="
          absolute
          left-4
          top-3
          text-slate-400
        "
      />

      <input
        type="text"
        placeholder="Search customers, campaigns..."
        className="
          w-80
          pl-12
          pr-4
          py-3
          rounded-xl
          bg-slate-100
          border
          border-slate-200
          outline-none
          focus:ring-2
          focus:ring-cyan-500
        "
      />

    </div>
  );
}

export default SearchBar;