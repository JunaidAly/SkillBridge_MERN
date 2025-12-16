function Button({ children, variant = "primary", onClick, className = "" }) {
  const baseStyles = "font-poppins font-medium px-2 sm:px-6 py-2 rounded-full transition-all";

  const variants = {
    primary: "bg-dark-blue text-white hover:opacity-90",
    outline: "border-2 border-dark-blue text-dark-blue hover:bg-dark-blue hover:text-white",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;
