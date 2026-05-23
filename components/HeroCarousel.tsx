"use client";

import { useEffect, useState } from "react";

const heroImages = [
  "/images/paseo-maritimo.png",
  "/images/portada.jpg",
  "/images/PORTADA 2.jpg",
  "/images/PHOTO-2024-06-17-21-07-17.jpg",
  "/images/PHOTO-2024-06-17-21-07-17 2.jpg",
  "/images/WhatsApp Image 2024-08-25 at 16.29.29.jpeg",
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % heroImages.length);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0">
      {heroImages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt="Apartamento turístico en El Campello"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      <div className="absolute inset-0 bg-black/45"></div>
    </div>
  );
}
