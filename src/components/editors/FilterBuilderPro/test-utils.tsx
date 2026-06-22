export function TooltipMock({
  trigger,
  children,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div data-testid="tooltip">
      {trigger}
      <span data-testid="tooltip-content">{children}</span>
    </div>
  );
}
