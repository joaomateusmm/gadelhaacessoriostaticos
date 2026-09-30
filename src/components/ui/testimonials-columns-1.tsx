"use client";

import { motion } from "motion/react";
import Image from "next/image";
import React from "react";

// 1. Definimos a "forma" que cada depoimento deve ter
export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
}

// 2. Ajustamos as props para usar a Interface criada acima
export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[]; // Aqui dizemos que é uma lista de Testimonial
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 bg-[#050505] pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="shadow-primary/10 w-full max-w-xs rounded-3xl border p-10 shadow-lg"
                  key={i}
                >
                  <div>{text}</div>
                  <div className="mt-5 flex items-center gap-2">
                    {/* Mantivemos a tag img para evitar configurações extras agora */}
                    <Image
                      width={40}
                      height={40}
                      src={image}
                      alt={name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <div className="leading-5 font-medium tracking-tight">
                        {name}
                      </div>
                      <div className="leading-5 tracking-tight opacity-60">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
