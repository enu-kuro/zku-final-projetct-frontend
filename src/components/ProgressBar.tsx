export interface ProgressBarProps
  extends React.ProgressHTMLAttributes<HTMLProgressElement> {
  className?: string;
  value?: number;
}
export const ProgressBar: React.FC<ProgressBarProps> = ({
  className,
  value = 0,
  ...props
}) => {
  return (
    <progress
      className={`progress ${className}`}
      value={value}
      max="100"
      {...props}
    />
  );
};
