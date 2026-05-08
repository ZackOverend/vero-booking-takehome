export default async function SlotPickerPage(props: PageProps<"/book/[physicianId]">) {
  const { physicianId } = await props.params;

  return (
    <main>
      <h1>Step 2 — Select a time slot</h1>
      <p>Physician: {physicianId}</p>
    </main>
  );
}
