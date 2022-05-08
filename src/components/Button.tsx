export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  loading?: boolean;
  children?: React.ReactNode;
}
export const Button: React.FC<ButtonProps> = ({
  className,
  loading,
  children,
  ...props
}) => {
  return (
    <button {...props} className={className + ` ${loading && "loading"}`}>
      {children}
    </button>
  );
};
