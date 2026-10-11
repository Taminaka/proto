"use client";

import { FormEvent, useEffect, useState } from "react";
import { getApiErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { getMyProfile, updateMyProfile, uploadAvatar } from "@/lib/auth/account-api";
import type { UserProfile } from "@/lib/auth/types";
import { getPublicCategories, type Category } from "@/lib/catalog/api";
import { listOffers, type Offer, type OfferType, getOffer, getRecommendations } from "@/lib/catalog/offer-api";
import { createManaged, deactivateManaged, deleteCategory, listCategories, listCommerceServices, listManaged, saveCategory, updateManaged, updateStatus } from "@/lib/catalog/management-api";

const tabs: { key: OfferType; label: string }[] = [
  { key: "attractions", label: "Atractivos" },
  { key: "commerces", label: "Comercios" },
  { key: "services", label: "Servicios" },
  { key: "events", label: "Eventos" },
];

export default function Home() {
  const { session, login, logout } = useAuth();
  const [active, setActive] = useState<OfferType>("attractions");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selected, setSelected] = useState<Offer | null>(null);
  const [recommendations, setRecommendations] = useState<{ item: Offer; reason: string }[]>([]);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [managementOpen, setManagementOpen] = useState(false);

  async function loadOffers(type = active) {
    try {
      setError("");
      const data = await listOffers(type, {
        ...(query ? { name: query } : {}),
        ...(categoryId ? { categoryId: Number(categoryId) } : {}),
      });
      setOffers(data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  useEffect(() => {
    getPublicCategories().then(setCategories).catch(() => undefined);
  }, []);

  useEffect(() => {
    loadOffers(active);
    // Search is intentionally triggered by submit, not every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  async function openOffer(offer: Offer) {
    try {
      setSelected(await getOffer(active, offer.id));
    } catch {
      setSelected(offer);
    }
  }

  async function loadRecommendations() {
    if (!session) {
      setAuthOpen(true);
      return;
    }

    try {
      const response = await getRecommendations();
      setRecommendations(response.items.slice(0, 3));
      document.getElementById("recommendations")?.scrollIntoView({ behavior: "smooth" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  async function openAccount() {
    if (!session) {
      setAuthOpen(true);
      return;
    }
    try {
      setProfile(await getMyProfile());
      setAccountOpen(true);
      setMobileMenuOpen(false);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#">TAMAKA<span>.</span></a>
        <nav className={mobileMenuOpen ? "main-nav open" : "main-nav"}>
          <a href="#explore" onClick={() => setMobileMenuOpen(false)}>Explorar</a>
          <a href="#recommendations" onClick={() => setMobileMenuOpen(false)}>Recomendaciones</a>
          {(session?.roles.includes("OPERADOR") || session?.roles.includes("GESTOR") || session?.roles.includes("ADMIN")) && <button className="nav-action" onClick={() => { setManagementOpen(true); setMobileMenuOpen(false); }}>Gestionar</button>}
          {session && <button className="mobile-account-link" onClick={() => void openAccount()}>Editar cuenta</button>}
        </nav>
        <div className="account-actions">
          {session ? (
            <>
              <button className="user-label account-link" onClick={() => void openAccount()}>{session.fullName}</button>
              <button className="link-button" onClick={() => void logout()}>Salir</button>
            </>
          ) : (
            <button className="link-button" onClick={() => setAuthOpen(true)}>Iniciar sesión</button>
          )}
          <button className="menu-toggle" aria-label="Abrir menú" aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen((open) => !open)}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">Santa Marta · Colombia</p>
            <h1>Encuentra tu próxima<br /><em>experiencia.</em></h1>
            <p className="hero-text">Explora lugares, comercios, servicios y eventos para vivir Santa Marta a tu manera.</p>
            <form className="search-box" onSubmit={(event) => { event.preventDefault(); void loadOffers(); }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué quieres descubrir?" />
              <button type="submit">Buscar</button>
            </form>
          </div>
          <div className="hero-art" aria-label="Imagen de destino">
            <div className="art-label">DESTINO<br /><strong>SANTA MARTA</strong></div>
          </div>
        </section>

        <section className="section" id="explore">
          <div className="section-heading">
            <div><p className="eyebrow">Oferta turística</p><h2>Explora Santa Marta</h2></div>
            <button className="text-action" onClick={() => void loadOffers()}>Ver todo →</button>
          </div>
          <div className="tabs">
            {tabs.map((tab) => <button key={tab.key} className={active === tab.key ? "tab active" : "tab"} onClick={() => setActive(tab.key)}>{tab.label}</button>)}
          </div>
          <div className="filters">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="">Todas las categorías</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <button className="filter-button" onClick={() => void loadOffers()}>Aplicar filtros</button>
          </div>
          {error && <div className="notice error">{error}</div>}
          <div className="offer-grid">
            {offers.map((offer) => <OfferCard key={offer.id} offer={offer} onClick={() => void openOffer(offer)} />)}
            {!offers.length && !error && <div className="empty-state">No encontramos resultados para esta búsqueda.</div>}
          </div>
        </section>

        <section className="feature-band">
          <div><p className="eyebrow">Descubre sin planearlo</p><h2>Recomendaciones<br /><em>para ti.</em></h2><p>Encuentra alternativas según tus intereses y el nivel de ocupación actual.</p><button className="dark-button" onClick={() => void loadRecommendations()}>Ver recomendaciones →</button></div>
          <div className="feature-index">01<br /><span>—</span><br />03</div>
        </section>

        <section className="section" id="recommendations">
          <div className="section-heading"><div><p className="eyebrow">Basado en reglas</p><h2>Recomendaciones</h2></div></div>
          {recommendations.length ? <div className="offer-grid">{recommendations.map((entry) => <OfferCard key={entry.item.id} offer={entry.item} reason={entry.reason} onClick={() => void openOffer(entry.item)} />)}</div> : <p className="muted-copy">Inicia sesión para recibir recomendaciones personalizadas.</p>}
        </section>

        {session && <AccountStrip sessionName={session.fullName} />}
      </main>

      <footer className="footer"><span className="brand">TAMAKA<span>.</span></span><span>Turismo que se siente.</span><span>© 2026 Tamaka</span></footer>
      {selected && <OfferModal offer={selected} onClose={() => setSelected(null)} />}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={login} />}
      {accountOpen && profile && <AccountModal profile={profile} onClose={() => setAccountOpen(false)} onSaved={setProfile} />}
      {managementOpen && session && <ManagementPanel roles={session.roles} onClose={() => setManagementOpen(false)} />}
    </div>
  );
}

function AccountModal({ profile, onClose, onSaved }: { profile: UserProfile; onClose: () => void; onSaved: (profile: UserProfile) => void }) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [address, setAddress] = useState(profile.address ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const updated = await updateMyProfile({ fullName, phone, address, avatarUrl });
      onSaved(updated);
      onClose();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setPending(false);
    }
  }

  async function selectAvatar(file: File | undefined) {
    if (!file) return;
    setPending(true);
    setError("");
    try {
      const updated = await uploadAvatar(file);
      setAvatarUrl(updated.avatarUrl ?? "");
      onSaved(updated);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setPending(false);
    }
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal account-modal" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>×</button>
      <p className="eyebrow">Tu cuenta</p>
      <h2>Editar perfil</h2>
      <div className="profile-photo">
        {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{fullName.slice(0, 1).toUpperCase()}</span>}
        <label className="upload-button">Cambiar foto<input type="file" accept="image/*" onChange={(event) => void selectAvatar(event.target.files?.[0])} /></label>
      </div>
      <form onSubmit={save}>
        <label>Nombre completo<input value={fullName} onChange={(event) => setFullName(event.target.value)} required /></label>
        <label>Correo<input value={profile.email} disabled /></label>
        <label>Teléfono<input value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label>Dirección<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        {error && <div className="notice error">{error}</div>}
        <button className="dark-button" disabled={pending}>{pending ? "Guardando..." : "Guardar cambios"}</button>
      </form>
    </div>
  </div>;
}

function OfferCard({ offer, reason, onClick }: { offer: Offer; reason?: string; onClick: () => void }) {
  return <button className="offer-card" onClick={onClick}><div className="card-image"><span>{offer.name.slice(0, 1)}</span>{offer.occupancyLevel && <b className={`occupancy ${offer.occupancyLevel.toLowerCase()}`}>{offer.occupancyLevel}</b>}</div><div className="card-body"><p className="card-type">{offer.categoryNames?.[0] ?? "Experiencia"}</p><h3>{offer.name}</h3><p className="card-description">{offer.description ?? offer.address ?? "Descubre esta experiencia en Santa Marta."}</p>{reason && <p className="reason">“{reason}”</p>}<span className="card-link">Ver detalle →</span></div></button>;
}

function OfferModal({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><div className="modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}>×</button><div className="modal-image">{offer.name.slice(0, 1)}</div><p className="eyebrow">{offer.categoryNames?.join(" · ") ?? "Oferta turística"}</p><h2>{offer.name}</h2><p>{offer.description ?? "Una experiencia para descubrir Santa Marta."}</p>{offer.address && <p className="modal-detail">⌖ {offer.address}</p>}{offer.occupancyLevel && <p className="modal-detail">Ocupación actual: <strong>{offer.occupancyLevel}</strong></p>}<button className="dark-button" onClick={onClose}>Cerrar detalle</button></div></div>;
}

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (request: { email: string; password: string }) => Promise<unknown> }) {
  const [email, setEmail] = useState("admin@tamaka.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setPending(true); setError("");
    try { await onLogin({ email, password }); onClose(); } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setPending(false); }
  }
  return <div className="modal-backdrop"><div className="modal auth-modal"><button className="modal-close" onClick={onClose}>×</button><p className="eyebrow">Tu cuenta</p><h2>Iniciar sesión</h2><form onSubmit={submit}><label>Correo<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Contraseña<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <div className="notice error">{error}</div>}<button className="dark-button" disabled={pending}>{pending ? "Entrando..." : "Entrar"}</button></form></div></div>;
}

function AccountStrip({ sessionName }: { sessionName: string }) {
  return <section className="account-strip" id="operator"><div><p className="eyebrow">Sesión activa</p><h2>Hola, {sessionName.split(" ")[0]}.</h2><p>Desde aquí podrás gestionar tu perfil y los módulos disponibles según tu rol.</p></div><a className="dark-button" href="#account">Ir a mi cuenta →</a></section>;
}

function ManagementPanel({ roles, onClose }: { roles: UserProfile["roles"]; onClose: () => void }) {
  const isAdmin = roles.includes("ADMIN");
  const isGestor = roles.includes("GESTOR") || isAdmin;
  const isOperator = roles.includes("OPERADOR") || isAdmin;
  const [type, setType] = useState<OfferType>(isGestor ? "attractions" : "commerces");
  const [items, setItems] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [commerceOptions, setCommerceOptions] = useState<Offer[]>([]);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [commerceId, setCommerceId] = useState("");
  const [form, setForm] = useState({ name: "", description: "", address: "", price: "", capacity: "", categoryIds: "", eventType: "CULTURAL", startDate: "", endDate: "", location: "" });
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const availableTypes = [
    ...(isGestor ? [{ value: "attractions" as OfferType, label: "Atractivos" }, { value: "events" as OfferType, label: "Eventos" }] : []),
    ...(isOperator ? [{ value: "commerces" as OfferType, label: "Comercios" }, { value: "services" as OfferType, label: "Servicios" }, { value: "events" as OfferType, label: "Eventos de comercio" }] : []),
  ];

  async function load() {
    try {
      setError("");
      const data = type === "services" && commerceId
        ? await listCommerceServices(Number(commerceId))
        : await listManaged(type, type === "commerces" && !isAdmin);
      setItems(data);
      if (type === "services") setCommerceOptions(await listManaged("commerces", !isAdmin));
      if (isAdmin) setCategories(await listCategories(true));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  useEffect(() => { void load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, commerceId]);

  function resetForm() {
    setEditing(null);
    setForm({ name: "", description: "", address: "", price: "", capacity: "", categoryIds: "", eventType: "CULTURAL", startDate: "", endDate: "", location: "" });
  }

  function edit(item: Offer) {
    setEditing(item);
    setForm({
      name: item.name ?? "", description: item.description ?? "", address: item.address ?? "",
      price: item.price?.toString() ?? "", capacity: item.capacity?.toString() ?? "",
      categoryIds: "", eventType: item.eventType ?? "CULTURAL", startDate: item.startDate?.slice(0, 16) ?? "",
      endDate: item.endDate?.slice(0, 16) ?? "", location: item.location ?? item.address ?? "",
    });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true); setError(""); setNotice("");
    try {
      const categoryIds = form.categoryIds.split(",").map(Number).filter(Boolean);
      const payload: Record<string, unknown> = {
        name: form.name, description: form.description || null, categoryIds,
      };
      if (type === "attractions") Object.assign(payload, { address: form.address || null, capacity: form.capacity ? Number(form.capacity) : null, images: [] });
      if (type === "commerces") Object.assign(payload, { address: form.address || null, images: [], schedules: [], phone: null, email: null, website: null });
      if (type === "services") Object.assign(payload, { price: form.price ? Number(form.price) : null, durationMinutes: 60, images: [], isVisible: true });
      const destinationEvent = type === "events" && isGestor && !roles.includes("OPERADOR");
      if (type === "events") Object.assign(payload, { eventType: destinationEvent ? "DESTINO" : "COMERCIO", startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString(), location: form.location || null, images: [], ...(destinationEvent ? {} : { commerceId: Number(commerceId) }) });
      if (editing) await updateManaged(type, editing.id, payload, destinationEvent);
      else await createManaged(type, payload, type === "services" || type === "events" ? Number(commerceId) : undefined, destinationEvent ? "destination" : "commerce");
      setNotice(editing ? "Cambios guardados." : "Elemento creado."); resetForm(); await load();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setPending(false); }
  }

  async function deactivate(id: number) {
    if (!window.confirm("¿Quieres desactivar o eliminar este elemento?")) return;
    try { await deactivateManaged(type, id, type === "events" && isGestor && !roles.includes("OPERADOR")); setNotice("Acción realizada."); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  async function changeStatus(id: number, status: string) {
    try { await updateStatus(type, id, status); setNotice("Estado actualizado."); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  async function saveCategoryForm(event: FormEvent) {
    event.preventDefault(); setPending(true);
    try { await saveCategory(null, categoryForm); setCategoryForm({ name: "", description: "" }); setNotice("Categoría creada."); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); } finally { setPending(false); }
  }

  async function removeCategory(id: number) {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    try { await deleteCategory(id); setNotice("Categoría eliminada."); await load(); }
    catch (requestError) { setError(getApiErrorMessage(requestError)); }
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal management-modal" onClick={(event) => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>×</button>
      <p className="eyebrow">Panel de gestión</p>
      <h2>{isAdmin ? "Administrar Tamaka" : "Mi operación"}</h2>
      <div className="management-toolbar">
        <select value={type} onChange={(event) => { setType(event.target.value as OfferType); resetForm(); }}>
          {availableTypes.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
        {(type === "services" || (type === "events" && !isGestor)) && <select value={commerceId} onChange={(event) => setCommerceId(event.target.value)}><option value="">Selecciona comercio</option>{commerceOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
        <button className="filter-button" onClick={() => { resetForm(); }}>Nuevo</button>
      </div>
      {error && <div className="notice error">{error}</div>}
      {notice && <div className="notice success">{notice}</div>}
      <div className="management-layout">
        <div className="management-list">
          {items.map((item) => <div className="management-row" key={item.id}><div><strong>{item.name}</strong><small>{item.status ?? "ACTIVO"}{item.commerceName ? ` · ${item.commerceName}` : ""}</small></div><div className="row-actions"><button onClick={() => edit(item)}>Editar</button>{isAdmin && <button onClick={() => void changeStatus(item.id, item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}>{item.status === "ACTIVE" ? "Desactivar" : "Activar"}</button>}{!isAdmin && <button onClick={() => void deactivate(item.id)}>Eliminar</button>}</div></div>)}
          {!items.length && <p className="muted-copy">No hay elementos para administrar.</p>}
        </div>
        <form className="management-form" onSubmit={submit}>
          <h3>{editing ? "Editar" : "Crear"} {availableTypes.find((option) => option.value === type)?.label}</h3>
          {(type === "services" || (type === "events" && !isGestor)) && !commerceId && <p className="notice">Selecciona primero un comercio.</p>}
          <label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label>Descripción<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {(type === "attractions" || type === "commerces") && <label>Dirección<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>}
          {type === "attractions" && <label>Capacidad<input type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>}
          {type === "services" && <label>Precio<input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>}
          {type === "events" && <><label>Inicio<input type="datetime-local" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label><label>Fin<input type="datetime-local" required value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label><label>Ubicación<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} /></label></>}
          {type !== "services" && <label>Categorías (IDs separados por coma)<input value={form.categoryIds} onChange={(event) => setForm({ ...form, categoryIds: event.target.value })} placeholder="1, 2" /></label>}
          <button className="dark-button" disabled={pending || ((type === "services" || (type === "events" && !isGestor)) && !commerceId)}>{pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear"}</button>
        </form>
      </div>
      {isAdmin && <div className="category-admin"><h3>Categorías</h3><form onSubmit={saveCategoryForm}><input required placeholder="Nombre" value={categoryForm.name} onChange={(event) => setCategoryForm({ ...categoryForm, name: event.target.value })} /><input placeholder="Descripción" value={categoryForm.description} onChange={(event) => setCategoryForm({ ...categoryForm, description: event.target.value })} /><button className="filter-button" disabled={pending}>Crear categoría</button></form><div className="category-list">{categories.map((category) => <span key={category.id}>{category.name}<button onClick={() => void removeCategory(category.id)}>×</button></span>)}</div></div>}
    </div>
  </div>;
}
