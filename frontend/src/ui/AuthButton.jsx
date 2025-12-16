function Button({ children, variant = "primary", onClick, className = "", type = "button", disabled = false, ...props }) {
  const baseStyles = "font-poppins font-medium px-2 sm:px-6 py-2 rounded-full transition-all";

  const variants = {
    primary: "bg-dark-blue text-white hover:opacity-90",
    outline: "border-2 border-dark-blue text-dark-blue hover:bg-dark-blue hover:text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
