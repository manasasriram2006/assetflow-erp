export const Button = ({ as: Component = "button", children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    danger: "bg-danger text-white hover:bg-red-700"
  };

  return (
    <Component
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
