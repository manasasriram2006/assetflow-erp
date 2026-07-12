export const Button = ({ as: Component = "button", children, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-primary text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-primary",
    danger: "bg-danger text-white shadow-sm shadow-red-600/20 hover:bg-red-700",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  };

  return (
    <Component
      className={`focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
};
