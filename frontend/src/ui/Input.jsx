import { EyeOff } from "lucide-react";

function Input({
  type = "text",
  placeholder,
  value,
  onChange,
  label,
  name,
  variant = "default",
  className = "",
  ...props
}) {
  const baseStyles =
    "font-poppins w-full px-4 py-3 rounded-lg border outline-none transition-all";

  const variants = {
    default: "border-[#D0D0D0] focus:border-teal focus:ring-1 focus:ring-teal",
    filled:
      "bg-light-bg border-transparent focus:border-teal focus:ring-1 focus:ring-teal",
    outline: "border-dark-blue focus:border-teal focus:ring-1 focus:ring-teal",
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className="font-family-poppins text-sm font-medium text-gray"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${baseStyles} ${variants[variant]} ${className}`}
          {...props}
        />
        {type === "password" && <EyeOff className="absolute right-2 top-1/2 -translate-y-1/2" />}
      </div>
    </div>
  );
}

export default Input;
