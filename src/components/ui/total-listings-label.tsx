



export default function TotalListingsLabel({total}: {total: number}) {
  return (
    <div className="rounded-full bg-secondary text-secondary-foreground px-4 py-2 font-medium text-sm">
      Total Listings: {total}
    </div>
  );
}