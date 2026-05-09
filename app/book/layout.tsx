export default function BookLayout({ children }: LayoutProps<"/book">) {
  return (
    <div className="flex flex-col flex-1">
      <div className="max-w-3xl mx-auto w-full px-4 pt-12 pb-4">
        {children}
      </div>
    </div>
  );
}
