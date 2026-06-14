function StatCard({
  title,
  value,
  color,
}) {
  return (
    <div
      className="
      bg-white
      rounded-2xl
      shadow-lg
      p-6
      hover:scale-105
      transition
      duration-300
      "
    >
      <p
        className="
        text-gray-500
        text-sm
        "
      >
        {title}
      </p>

      <h2
        className={`
        text-4xl
        font-bold
        mt-2
        ${color}
        `}
      >
        {value}
      </h2>
    </div>
  );
}

export default StatCard;