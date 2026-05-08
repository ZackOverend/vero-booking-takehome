export default function BookLayout({ children }: LayoutProps<"/book">) {
  return (
    <div className="flex flex-col flex-1">
      {/* StepIndicator — added when booking steps are built */}
      {children}
    </div>
  );
}
