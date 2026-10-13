import { ArrowRight } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

export interface ArrowButtonProps extends React.ComponentProps<"button"> {
  direction?: "right" | "left";
  position?: "left" | "right";
  /**
   * "span" se usa cuando el boton va DENTRO de otro elemento interactivo
   * (por ejemplo la tarjeta, que ya es un <button>). Poner un <button> dentro
   * de otro <button> es HTML invalido, asi que en ese caso se renderiza como
   * texto con apariencia de boton.
   */
  as?: "button" | "span";
  variant?: "link" | "solid";
}

export function ArrowButton({
  children,
  direction = "right",
  position = "right",
  className,
  as = "button",
  variant = "link",
  ...props
}: ArrowButtonProps) {
  const arrow = (
    <ArrowRight
      data-icon={position === "left" ? "inline-start" : "inline-end"}
      aria-hidden="true"
      className={cn(
        "arrow-button__icon",
        direction === "left" && "-scale-x-100",
        direction === "left"
          ? "group-hover/button:-translate-x-0.5"
          : "group-hover/button:translate-x-0.5",
      )}
    />
  );

  const clases = cn(
    "arrow-button",
    "group/button",
    `arrow-button--${variant}`,
    direction === "left" && "arrow-button--left",
    className,
  );

  if (as === "span") {
    return (
      <span className={clases} {...(props as React.ComponentProps<"span">)}>
        {position === "left" && arrow}
        {children}
        {position === "right" && arrow}
      </span>
    );
  }

  return (
    <button type="button" className={clases} {...props}>
      {position === "left" && arrow}
      {children}
      {position === "right" && arrow}
    </button>
  );
}

export default ArrowButton;
