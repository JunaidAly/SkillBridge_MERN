function Button({ children, variant = "primary", onClick, className = "" }) {
  const baseStyles = "font-family-poppins font-medium px-2 sm:px-6 py-2 rounded-lg transition-all";

  const variants = {
    primary: "bg-teal text-white hover:opacity-90",
    secondary: "text-black hover:text-teal sm:text-[700] border-2 border-[#D0D0D0] hover:bg-dark-blue hover:text-white",
    herobtn: "bg-dark-blue text-white hover:opacity-90",
    outline: "border-1 border-gray text-black hover:bg-dark-blue hover:text-white",
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
