export default async function DetailsPage(props: PageProps<"/book/[physicianId]/details">) {
  const { physicianId } = await props.params;

  return (
    <main>
      <h1>Step 3 — Your details</h1>
      <p>Physician: {physicianId}</p>
    </main>
  );
}
