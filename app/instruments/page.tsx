import {createClient} from "@/lib/supabase/server";
import {Suspense} from "react";

async function InstrumentData() {
  const supabase = await createClient();
  const {data: instruments} = await supabase.from("instruments").select();

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>
}

export default function Instruments() {
  return (
    <Suspense fallback={<div>Loading instruments...</div>}>
      <InstrumentData/>
    </Suspense>
  )
}