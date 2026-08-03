import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type LabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
  className?: string;
};

export function FormLabel({
  htmlFor,
  children,
  optional,
  className = "",
}: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-sm font-medium text-gray-400 ${className || "mb-2 block"}`}
    >
      {children}
      {optional && (
        <span className="ml-1 text-gray-600">(optional)</span>
      )}
    </label>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
};

export function FormInput({ error, className = "", id, ...props }: InputProps) {
  return (
    <div>
      <input
        id={id}
        className={`w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
};

export function FormTextarea({
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  return (
    <div>
      <textarea
        id={id}
        className={`w-full rounded-xl border border-white/10 bg-black/60 p-3 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400 ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
