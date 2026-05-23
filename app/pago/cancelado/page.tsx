export default function PagoCanceladoPage() {
  return (
    <main style={{ padding: "40px", textAlign: "center" }}>
      <h1>Pago cancelado</h1>

      <p>
        El proceso de pago se ha cancelado y no se ha realizado ningún cargo.
      </p>

      <p>
        Puedes volver a intentarlo o contactar directamente por WhatsApp.
      </p>

      <a
        href="/"
        style={{
          display: "inline-block",
          marginTop: "24px",
          padding: "12px 20px",
          background: "#111",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "8px",
        }}
      >
        Volver a reservar
      </a>
    </main>
  );
}
