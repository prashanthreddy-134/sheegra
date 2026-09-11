import NavBar from "../components/NavBar";

// TEMPLATE ONLY — not legal advice. Fill in your real business name, address, GSTIN,
// and grievance officer details before publishing, and have a lawyer review this
// before you rely on it, especially the liability and dispute-resolution sections.
export default function Terms() {
  return (
    <div className="min-h-screen bg-cream">
      <NavBar />
      <div className="max-w-2xl mx-auto px-4 py-8 prose prose-sm">
        <h1 className="font-display font-800 text-2xl mb-1">Terms of Service</h1>
        <p className="text-sm text-ink/50 mb-6">Last updated: [DATE] · [YOUR BUSINESS LEGAL NAME]</p>

        <div className="space-y-5 text-sm text-ink/80 leading-relaxed">
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">1. Who we are</h2>
            <p>[YOUR BUSINESS LEGAL NAME], registered at [YOUR REGISTERED ADDRESS] ("Sheegra", "we", "us"), operates this website, mobile app, and related services (the "Platform") for the sale of groceries and household items.</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">2. Account & OTP login</h2>
            <p>You must provide a valid mobile number and verify it via OTP to place orders. You're responsible for keeping access to that number secure — we treat a successful OTP login as authorization to act on your account.</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">3. Orders & pricing</h2>
            <p>Prices shown at checkout are final at the time of order. We reserve the right to cancel an order if an item becomes unavailable after you've paid, in which case you'll receive a full refund for that item.</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">4. Payments</h2>
            <p>Payments are processed by Razorpay. We do not store your card, UPI, or bank details on our servers.</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">5. Delivery</h2>
            <p>Delivery times shown are estimates, not guarantees. [DESCRIBE YOUR SERVICE AREA / HOURS.]</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">6. Cancellations & refunds</h2>
            <p>See our <a href="/refund-policy" className="text-leaf underline">Refund Policy</a> for details.</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">7. Limitation of liability</h2>
            <p>[CONSULT A LAWYER FOR THIS SECTION — liability limits are jurisdiction-specific and this template intentionally leaves it blank rather than guess at legal language for you.]</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">8. Grievance officer</h2>
            <p>[NAME], [EMAIL], [PHONE] — as required under Indian e-commerce/consumer protection rules if you operate in India.</p>
          </section>
          <section>
            <h2 className="font-display font-700 text-base text-ink mb-1">9. Contact</h2>
            <p>[SUPPORT EMAIL] · [SUPPORT PHONE]</p>
          </section>
        </div>
      </div>
    </div>
  );
}
