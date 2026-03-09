
# Ardrop – sugestie zmian landing page (HTML / CSS)

Dokument opisuje propozycje zmian UX i struktury strony głównej ardrop.pl.
Celem jest przedstawienie Ardrop jako **platformy dla branży HoReCa**, a nie tylko miejsca do zamawiania produktów.

---

# 1. Hero section

## Problem
Obecna sekcja hero komunikuje głównie zamówienia i faktury.
Brakuje:
- mocnego komunikatu o platformie
- call to action
- informacji dla kogo jest platforma

## HTML

```html
<section class="hero">
  <div class="hero-content">

    <h1>Platforma zakupów i narzędzi dla branży HoReCa</h1>

    <p>
      Kupuj produkty od sprawdzonych producentów,
      zarządzaj zamówieniami i korzystaj z narzędzi dla gastronomii
      w jednym miejscu.
    </p>

    <div class="hero-buttons">
      <a href="/app" class="btn-primary">Zaloguj się</a>
      <a href="/partner" class="btn-secondary">Zostań partnerem</a>
    </div>

  </div>
</section>
```

## CSS

```css
.hero {
  padding: 120px 20px;
  background: #fafafa;
  text-align: center;
}

.hero h1 {
  font-size: 42px;
  max-width: 900px;
  margin: auto;
}

.hero p {
  font-size: 20px;
  margin-top: 20px;
  color: #555;
}

.hero-buttons {
  margin-top: 40px;
}

.btn-primary {
  background: #e63946;
  color: white;
  padding: 14px 28px;
  border-radius: 6px;
  text-decoration: none;
}

.btn-secondary {
  border: 2px solid #e63946;
  color: #e63946;
  padding: 14px 28px;
  border-radius: 6px;
  text-decoration: none;
  margin-left: 12px;
}
```

---

# 2. Sekcja "Dlaczego Ardrop"

## Cel
Pokazanie platformy jako rozwiązania dla branży horeca, a nie tylko sklepu.

## HTML

```html
<section class="features">

<h2>Dlaczego Ardrop?</h2>

<div class="features-grid">

<div class="feature">
<h3>Marketplace HoReCa</h3>
<p>Kupuj produkty od wielu producentów w jednym miejscu.</p>
</div>

<div class="feature">
<h3>Automatyczne faktury</h3>
<p>Każde zamówienie generuje fakturę dostępną w panelu.</p>
</div>

<div class="feature">
<h3>Narzędzia dla restauracji</h3>
<p>Food cost, planowanie menu i zarządzanie zamówieniami.</p>
</div>

<div class="feature">
<h3>Baza wiedzy</h3>
<p>Webinary i poradniki dla branży gastronomicznej.</p>
</div>

</div>

</section>
```

## CSS

```css
.features {
  padding: 80px 20px;
  max-width: 1200px;
  margin: auto;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4,1fr);
  gap: 30px;
  margin-top: 40px;
}

.feature {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.05);
}
```

---

# 3. Sekcja partnerów (social proof)

Pokazuje, że platformie już zaufały firmy z branży.

## HTML

```html
<section class="partners">

<h2>Pierwsi partnerzy Ardrop</h2>

<div class="partners-logos">

<img src="/logos/aromatycznie.png">
<img src="/logos/nowesmaki.png">
<img src="/logos/ranch.png">

</div>

</section>
```

## CSS

```css
.partners {
  padding: 80px 20px;
  background: #f5f5f5;
  text-align: center;
}

.partners-logos {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 40px;
}

.partners-logos img {
  height: 50px;
  opacity: 0.8;
}
```

---

# 4. Sekcja "Jak działa Ardrop"

Pokazuje prosty flow działania platformy.

## HTML

```html
<section class="how">

<h2>Jak działa Ardrop?</h2>

<div class="steps">

<div class="step">
<span>1</span>
<p>Rejestrujesz konto restauracji</p>
</div>

<div class="step">
<span>2</span>
<p>Przeglądasz ofertę producentów</p>
</div>

<div class="step">
<span>3</span>
<p>Składasz zamówienie</p>
</div>

<div class="step">
<span>4</span>
<p>Otrzymujesz fakturę i dostawę</p>
</div>

</div>

</section>
```

---

# 5. Sekcja wizji platformy

Pokazuje rozwój Ardrop jako platformy SaaS dla gastronomii.

## HTML

```html
<section class="vision">

<h2>Więcej niż marketplace</h2>

<p>
Ardrop rozwija się jako platforma zakupów, wiedzy i narzędzi dla gastronomii.
</p>

<ul>
<li>webinary i szkolenia</li>
<li>kalkulatory food cost</li>
<li>cyfrowe menu restauracji</li>
<li>zarządzanie zamówieniami</li>
</ul>

</section>
```

---

# Najważniejsze zmiany UX

1. Mocny hero section z CTA  
2. Sekcja partnerów (social proof)  
3. Sekcja narzędzi platformy  
4. Sekcja wizji rozwoju Ardrop  

Cel:  
Strona powinna wyglądać jak **platforma SaaS dla horeca**, a nie jak zwykły sklep.
