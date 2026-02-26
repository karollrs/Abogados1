interface Props {
  title: string;
  children: React.ReactNode;
}

export default function SectionWrapper({ title, children }: Props) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        {title}
      </h2>
      {children}
    </section>
  );
}
