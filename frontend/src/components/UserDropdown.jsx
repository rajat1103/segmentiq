function UserDropdown() {
  return (

    <div
      className="
      flex
      items-center
      gap-3
      px-4
      py-2
      rounded-xl
      bg-slate-100
      cursor-pointer
    "
    >

      <div
        className="
        w-10
        h-10
        rounded-full
        bg-cyan-500
        flex
        items-center
        justify-center
        text-white
        font-bold
      "
      >
        R
      </div>

      <div>

        <p className="font-semibold text-slate-700">
          Rishabh
        </p>

        <p className="text-xs text-slate-500">
          Admin
        </p>

      </div>

    </div>

  );
}

export default UserDropdown;