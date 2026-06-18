// POST jobs-create — a customer opens a new job request.
// Standard trade: pass the chosen `pro_id` (targeted request). Open "Other"
// job: pass `is_open: true` + a `budget`, broadcast to matching pros.
// Pricing/fees are NOT set here — they come from the pro's quote or the budget.
import { handle, json, HttpError } from "../_shared/http.ts";
import { requireUser, serviceClient } from "../_shared/supabase.ts";
import { parseBody, reqString, reqTrade, reqMoney, optString, reqUuid } from "../_shared/validate.ts";

Deno.serve(handle(async (req) => {
  const { user } = await requireUser(req);
  const body = await parseBody(req);

  const trade = reqTrade(body);
  const problem = reqString(body, "problem");
  const isOpen = body.is_open === true || trade === "other";
  const lat = typeof body.lat === "number" ? body.lat : null;
  const lng = typeof body.lng === "number" ? body.lng : null;

  const row: Record<string, unknown> = {
    customer_id: user.id,
    trade,
    problem,
    is_open: isOpen,
    address: optString(body, "address"),
    lat,
    lng,
    status: "requested",
  };

  if (isOpen) {
    const budget = reqMoney(body, "budget");
    if (budget <= 0) throw new HttpError(400, "budget must be greater than 0");
    row.budget = budget;
  } else {
    row.pro_id = reqUuid(body, "pro_id"); // the pro the customer chose
  }

  const service = serviceClient();
  const { data, error } = await service.from("jobs").insert(row).select("*").single();
  if (error) throw error;
  return json({ job: data }, 201);
}));
