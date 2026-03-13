(() => {
  const App = (window.MonitorApp = window.MonitorApp || {});

  App.atlsCasesDataset = {
    "dataset_id": "atls-fictitious-cases-es-v1",
    "title": "Casos ficticios de pacientes para evaluación tipo ATLS",
    "language": "es-CR",
    "format_version": "1.0",
    "description": "Conjunto de casos ficticios estructurados para carga en sistemas de entrenamiento, evaluación o simulación clínica tipo ATLS.",
    "navigation": {
      "ordered_case_ids": [
        "ATLS-001",
        "ATLS-002",
        "ATLS-003",
        "ATLS-004",
        "ATLS-005",
        "ATLS-006"
      ],
      "entry_case_id": "ATLS-001"
    },
    "case_index": [
      {
        "id": "ATLS-001",
        "title": "Trauma cerrado por accidente de tránsito con compromiso torácico",
        "category": "trauma_cerrado",
        "difficulty": "intermedia",
        "next_case_id": "ATLS-002"
      },
      {
        "id": "ATLS-002",
        "title": "Herida penetrante precordial con sospecha de taponamiento cardíaco",
        "category": "trauma_penetrante",
        "difficulty": "alta",
        "previous_case_id": "ATLS-001",
        "next_case_id": "ATLS-003"
      },
      {
        "id": "ATLS-003",
        "title": "Trauma pediátrico con abdomen agudo hemorrágico",
        "category": "trauma_pediatrico",
        "difficulty": "intermedia",
        "previous_case_id": "ATLS-002",
        "next_case_id": "ATLS-004"
      },
      {
        "id": "ATLS-004",
        "title": "Trauma craneoencefálico grave con signos de herniación",
        "category": "neurotrauma",
        "difficulty": "alta",
        "previous_case_id": "ATLS-003",
        "next_case_id": "ATLS-005"
      },
      {
        "id": "ATLS-005",
        "title": "Gran quemado con lesión inhalatoria",
        "category": "quemaduras",
        "difficulty": "intermedia",
        "previous_case_id": "ATLS-004",
        "next_case_id": "ATLS-006"
      },
      {
        "id": "ATLS-006",
        "title": "Politrauma con fractura pélvica y shock hemorrágico",
        "category": "shock_hemorragico",
        "difficulty": "alta",
        "previous_case_id": "ATLS-005"
      }
    ],
    "cases": [
      {
        "id": "ATLS-001",
        "title": "Trauma cerrado por accidente de tránsito con compromiso torácico",
        "status": "active",
        "category": "trauma_cerrado",
        "difficulty": "intermedia",
        "patient": {
          "age": 28,
          "sex": "masculino",
          "weight_kg": 78
        },
        "scenario": {
          "setting": "sala de trauma",
          "mechanism_of_injury": "choque frontal a alta velocidad, sin cinturón de seguridad",
          "elapsed_time_minutes": 10,
          "chief_complaint": "disnea intensa y dolor torácico"
        },
        "initial_vitals": {
          "heart_rate_bpm": 132,
          "blood_pressure_mmHg": "90/60",
          "respiratory_rate_bpm": 30,
          "spo2_percent": 88,
          "temperature_c": 36.1,
          "gcs": 12
        },
        "primary_survey_findings": {
          "airway": "permeable, responde con frases cortas",
          "breathing": "trabajo respiratorio aumentado, ruidos respiratorios disminuidos en hemitórax izquierdo, desviación traqueal leve",
          "circulation": "taquicardia, piel fría, llenado capilar lento",
          "disability": "confuso, obedece órdenes simples",
          "exposure": "hematoma en tórax izquierdo y abrasiones abdominales"
        },
        "secondary_survey_findings": {
          "chest": [
            "dolor a la palpación en hemitórax izquierdo",
            "asimetría respiratoria"
          ],
          "abdomen": [
            "dolor en cuadrante superior izquierdo",
            "defensa leve"
          ],
          "extremities": [
            "sin deformidades mayores"
          ]
        },
        "likely_life_threats": [
          "neumotórax a tensión",
          "hemorragia intraabdominal por lesión esplénica"
        ],
        "expected_actions": [
          "realizar evaluación primaria ABCDE",
          "administrar oxígeno a alto flujo",
          "descompresión torácica inmediata",
          "colocar dos accesos intravenosos gruesos",
          "iniciar reanimación con hemoderivados según protocolo",
          "solicitar FAST",
          "activar valoración quirúrgica urgente"
        ],
        "evaluation_points": {
          "critical_errors": [
            "demorar la descompresión torácica esperando imagen",
            "no reconocer shock hemorrágico"
          ],
          "must_identify": [
            "amenaza inmediata en B",
            "necesidad de control de hemorragia"
          ]
        },
        "navigation": {
          "previous_case_id": null,
          "next_case_id": "ATLS-002",
          "tags": [
            "ABCDE",
            "torax",
            "shock"
          ]
        }
      },
      {
        "id": "ATLS-002",
        "title": "Herida penetrante precordial con sospecha de taponamiento cardíaco",
        "status": "active",
        "category": "trauma_penetrante",
        "difficulty": "alta",
        "patient": {
          "age": 34,
          "sex": "masculino",
          "weight_kg": 82
        },
        "scenario": {
          "setting": "servicio de emergencias",
          "mechanism_of_injury": "herida por arma blanca en región precordial",
          "elapsed_time_minutes": 20,
          "chief_complaint": "dolor torácico y sensación de ahogo"
        },
        "initial_vitals": {
          "heart_rate_bpm": 120,
          "blood_pressure_mmHg": "100/70",
          "respiratory_rate_bpm": 28,
          "spo2_percent": 91,
          "temperature_c": 36.4,
          "gcs": 15
        },
        "primary_survey_findings": {
          "airway": "permeable",
          "breathing": "ventilación conservada, dolor torácico",
          "circulation": "ingurgitación yugular, pulsos débiles, hipotensión progresiva",
          "disability": "alerta y orientado",
          "exposure": "herida en 4to espacio intercostal izquierdo paraesternal"
        },
        "secondary_survey_findings": {
          "chest": [
            "ruidos cardíacos hipofonéticos",
            "herida penetrante única"
          ],
          "abdomen": [
            "sin hallazgos relevantes"
          ],
          "extremities": [
            "perfusión distal disminuida"
          ]
        },
        "likely_life_threats": [
          "taponamiento cardíaco",
          "choque obstructivo"
        ],
        "expected_actions": [
          "aplicar ABCDE sin retrasos",
          "administrar oxígeno suplementario",
          "monitoreo continuo y acceso vascular",
          "realizar eFAST enfocado cardíaco",
          "activar manejo quirúrgico urgente",
          "considerar pericardiocentesis si deteriora y no hay acceso inmediato a cirugía"
        ],
        "evaluation_points": {
          "critical_errors": [
            "enviar a tomografía antes de estabilizar",
            "no reconocer Beck incompleto en trauma"
          ],
          "must_identify": [
            "mecanismo penetrante de alto riesgo",
            "causa obstructiva del shock"
          ]
        },
        "navigation": {
          "previous_case_id": "ATLS-001",
          "next_case_id": "ATLS-003",
          "tags": [
            "penetrante",
            "corazon",
            "shock obstructivo"
          ]
        }
      },
      {
        "id": "ATLS-003",
        "title": "Trauma pediátrico con abdomen agudo hemorrágico",
        "status": "active",
        "category": "trauma_pediatrico",
        "difficulty": "intermedia",
        "patient": {
          "age": 6,
          "sex": "masculino",
          "weight_kg": 22
        },
        "scenario": {
          "setting": "sala de trauma pediátrica",
          "mechanism_of_injury": "atropello a baja-mediana velocidad",
          "elapsed_time_minutes": 15,
          "chief_complaint": "somnolencia y dolor abdominal"
        },
        "initial_vitals": {
          "heart_rate_bpm": 150,
          "blood_pressure_mmHg": "80/50",
          "respiratory_rate_bpm": 34,
          "spo2_percent": 92,
          "temperature_c": 36.0,
          "gcs": 10
        },
        "primary_survey_findings": {
          "airway": "permeable con llanto débil",
          "breathing": "taquipnea sin asimetría marcada",
          "circulation": "extremidades frías, pulsos rápidos",
          "disability": "abre ojos al llamado, localiza dolor",
          "exposure": "equimosis abdominal y escoriaciones en miembros inferiores"
        },
        "secondary_survey_findings": {
          "abdomen": [
            "distensión abdominal",
            "dolor difuso",
            "defensa involuntaria"
          ],
          "extremities": [
            "sin fracturas expuestas"
          ],
          "pelvis": [
            "estable a la exploración cuidadosa"
          ]
        },
        "likely_life_threats": [
          "hemorragia intraabdominal",
          "shock hemorrágico pediátrico"
        ],
        "expected_actions": [
          "ABCDE con enfoque pediátrico",
          "oxígeno y preparación de vía aérea si empeora",
          "acceso vascular o intraóseo si es necesario",
          "bolo inicial guiado por protocolo local",
          "FAST urgente",
          "interconsulta quirúrgica inmediata"
        ],
        "evaluation_points": {
          "critical_errors": [
            "subestimar shock por presión aparentemente aún medible",
            "retrasar acceso vascular en paciente pediátrico inestable"
          ],
          "must_identify": [
            "signos pediátricos de hipoperfusión",
            "prioridad de control de hemorragia"
          ]
        },
        "navigation": {
          "previous_case_id": "ATLS-002",
          "next_case_id": "ATLS-004",
          "tags": [
            "pediatria",
            "abdomen",
            "hemorragia"
          ]
        }
      },
      {
        "id": "ATLS-004",
        "title": "Trauma craneoencefálico grave con signos de herniación",
        "status": "active",
        "category": "neurotrauma",
        "difficulty": "alta",
        "patient": {
          "age": 45,
          "sex": "masculino",
          "weight_kg": 85
        },
        "scenario": {
          "setting": "área de reanimación",
          "mechanism_of_injury": "caída de aproximadamente 4 metros",
          "elapsed_time_minutes": 30,
          "chief_complaint": "disminución progresiva del nivel de conciencia"
        },
        "initial_vitals": {
          "heart_rate_bpm": 52,
          "blood_pressure_mmHg": "180/100",
          "respiratory_rate_bpm": 10,
          "spo2_percent": 89,
          "temperature_c": 36.3,
          "gcs": 6
        },
        "primary_survey_findings": {
          "airway": "no protegida adecuadamente",
          "breathing": "respiración irregular",
          "circulation": "pulso presente, hipertensión con bradicardia",
          "disability": "pupila derecha dilatada, postura extensora al dolor",
          "exposure": "hematoma parietal derecho"
        },
        "secondary_survey_findings": {
          "head": [
            "sospecha de TCE severo",
            "sin hemorragia externa masiva"
          ],
          "neck": [
            "mantener inmovilización cervical"
          ],
          "extremities": [
            "sin lesiones prioritarias visibles"
          ]
        },
        "likely_life_threats": [
          "hipertensión intracraneal severa",
          "herniación cerebral inminente"
        ],
        "expected_actions": [
          "inmovilización cervical",
          "intubación de secuencia rápida según protocolo",
          "ventilación y oxigenación adecuadas evitando hipoxia",
          "medidas temporales de neuroprotección",
          "solicitar neuroimagen urgente si está disponible y no retrasa manejo definitivo",
          "activar neurocirugía"
        ],
        "evaluation_points": {
          "critical_errors": [
            "no proteger vía aérea con GCS 6",
            "permitir hipoxia o hipotensión"
          ],
          "must_identify": [
            "tríada sugestiva de hipertensión intracraneal",
            "prioridad de neuroprotección"
          ]
        },
        "navigation": {
          "previous_case_id": "ATLS-003",
          "next_case_id": "ATLS-005",
          "tags": [
            "TCE",
            "neurotrauma",
            "via aerea"
          ]
        }
      },
      {
        "id": "ATLS-005",
        "title": "Gran quemado con lesión inhalatoria",
        "status": "active",
        "category": "quemaduras",
        "difficulty": "intermedia",
        "patient": {
          "age": 30,
          "sex": "femenino",
          "weight_kg": 68
        },
        "scenario": {
          "setting": "emergencias",
          "mechanism_of_injury": "exposición a incendio en espacio cerrado",
          "elapsed_time_minutes": 25,
          "chief_complaint": "dolor intenso y dificultad respiratoria"
        },
        "initial_vitals": {
          "heart_rate_bpm": 120,
          "blood_pressure_mmHg": "100/65",
          "respiratory_rate_bpm": 30,
          "spo2_percent": 94,
          "temperature_c": 36.7,
          "gcs": 15
        },
        "primary_survey_findings": {
          "airway": "ronquera, hollín perioral, riesgo de edema progresivo",
          "breathing": "taquipnea",
          "circulation": "taquicardia sin sangrado externo mayor",
          "disability": "alerta",
          "exposure": "quemaduras de espesor parcial y total, aproximadamente 35% SCT"
        },
        "secondary_survey_findings": {
          "skin": [
            "quemaduras en tórax anterior",
            "miembros superiores comprometidos"
          ],
          "face": [
            "cejas chamuscadas",
            "hollín oral"
          ],
          "pain": [
            "dolor severo"
          ]
        },
        "likely_life_threats": [
          "lesión inhalatoria",
          "edema de vía aérea inminente",
          "shock por quemadura"
        ],
        "expected_actions": [
          "evaluar y asegurar vía aérea tempranamente",
          "administrar oxígeno al 100%",
          "calcular superficie corporal quemada",
          "iniciar reanimación hídrica según protocolo",
          "analgesia adecuada",
          "coordinar traslado o manejo en unidad especializada de quemados"
        ],
        "evaluation_points": {
          "critical_errors": [
            "demorar intubación en paciente con signos de lesión inhalatoria",
            "subestimar extensión de quemaduras"
          ],
          "must_identify": [
            "riesgo de deterioro rápido de vía aérea",
            "necesidad de reposición de volumen"
          ]
        },
        "navigation": {
          "previous_case_id": "ATLS-004",
          "next_case_id": "ATLS-006",
          "tags": [
            "quemaduras",
            "inhalacion",
            "via aerea"
          ]
        }
      },
      {
        "id": "ATLS-006",
        "title": "Politrauma con fractura pélvica y shock hemorrágico",
        "status": "active",
        "category": "shock_hemorragico",
        "difficulty": "alta",
        "patient": {
          "age": 39,
          "sex": "femenino",
          "weight_kg": 74
        },
        "scenario": {
          "setting": "bahía de trauma",
          "mechanism_of_injury": "motociclista impactada por vehículo liviano",
          "elapsed_time_minutes": 18,
          "chief_complaint": "dolor pélvico severo y mareo"
        },
        "initial_vitals": {
          "heart_rate_bpm": 138,
          "blood_pressure_mmHg": "82/54",
          "respiratory_rate_bpm": 26,
          "spo2_percent": 95,
          "temperature_c": 35.8,
          "gcs": 14
        },
        "primary_survey_findings": {
          "airway": "permeable",
          "breathing": "sin compromiso mayor evidente",
          "circulation": "piel pálida, diaforesis, shock manifiesto",
          "disability": "ansiosa, orientada parcialmente",
          "exposure": "dolor pélvico intenso, abrasiones múltiples"
        },
        "secondary_survey_findings": {
          "pelvis": [
            "inestabilidad sugerente, no repetir maniobras innecesarias"
          ],
          "abdomen": [
            "dolor infraumbilical leve"
          ],
          "extremities": [
            "hematoma proximal de muslo izquierdo"
          ]
        },
        "likely_life_threats": [
          "hemorragia pélvica masiva",
          "shock hemorrágico clase III-IV"
        ],
        "expected_actions": [
          "ABCDE con énfasis en control de hemorragia",
          "colocar binder pélvico de inmediato",
          "activar protocolo de transfusión masiva",
          "obtener eFAST y radiografía de pelvis si no retrasa tratamiento",
          "coordinar control definitivo de hemorragia"
        ],
        "evaluation_points": {
          "critical_errors": [
            "no colocar estabilización pélvica temprana",
            "insistir en múltiples exploraciones pélvicas"
          ],
          "must_identify": [
            "fuente pélvica probable de sangrado",
            "prioridad de hemostasia"
          ]
        },
        "navigation": {
          "previous_case_id": "ATLS-005",
          "next_case_id": null,
          "tags": [
            "pelvis",
            "hemorragia",
            "politrauma"
          ]
        }
      }
    ]
  };
})();