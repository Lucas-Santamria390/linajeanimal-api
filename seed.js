#!/usr/bin/env node

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Usuario = require('./models/Usuario');
const Especie = require('./models/Especie');
const Raza = require('./models/Raza');
const Animal = require('./models/Animal');

const speciesSeed = [
  { nombre: 'Bovino', descripcion: 'Ganado vacuno para producción de carne y leche' },
  { nombre: 'Ovino', descripcion: 'Ganado ovino para producción de carne y lana' },
  { nombre: 'Caprino', descripcion: 'Ganado caprino para producción de carne y leche' },
  { nombre: 'Porcino', descripcion: 'Ganado porcino para producción de carne' },
  { nombre: 'Equino', descripcion: 'Ganado equino para trabajo, deporte y cría' },
];

const usersSeed = [
  {
    nombre: 'Admin LinajeAnimal',
    email: 'admin@linajeanimal.test',
    password: 'Admin123!',
    rol: 'admin',
  },
  {
    nombre: 'Juan Ganadero',
    email: 'juan@linajeanimal.test',
    password: 'User123!',
    rol: 'user',
  },
  {
    nombre: 'Maria Criadora',
    email: 'maria@linajeanimal.test',
    password: 'User123!',
    rol: 'user',
  },
];

const breedSeed = [
  { nombre: 'Angus', descripcion: 'Raza bovina de carne de alta calidad', especie: 'Bovino' },
  { nombre: 'Hereford', descripcion: 'Raza bovina de carne resistente y adaptable', especie: 'Bovino' },
  { nombre: 'Holstein', descripcion: 'Raza bovina lechera de alto rendimiento', especie: 'Bovino' },
  { nombre: 'Dorper', descripcion: 'Raza ovina de carne de rápido crecimiento', especie: 'Ovino' },
  { nombre: 'Merino', descripcion: 'Raza ovina de lana fina de alta calidad', especie: 'Ovino' },
  { nombre: 'Hampshire', descripcion: 'Raza ovina de carne con buena conversión', especie: 'Ovino' },
  { nombre: 'Boer', descripcion: 'Raza caprina de carne con excelente musculatura', especie: 'Caprino' },
  { nombre: 'Saanen', descripcion: 'Raza caprina lechera de alta producción', especie: 'Caprino' },
  { nombre: 'Duroc', descripcion: 'Raza porcina de carne con marmoleo superior', especie: 'Porcino' },
  { nombre: 'Landrace', descripcion: 'Raza porcina de carne magra y prolificidad', especie: 'Porcino' },
  { nombre: 'Yorkshire', descripcion: 'Raza porcina de carne con gran capacidad maternal', especie: 'Porcino' },
  { nombre: 'Cuarto de Milla', descripcion: 'Raza equina versátil para trabajo y velocidad', especie: 'Equino' },
  { nombre: 'Criollo', descripcion: 'Raza equina resistente adaptada al clima local', especie: 'Equino' },
  { nombre: 'Árabe', descripcion: 'Raza equina de gran resistencia y nobleza', especie: 'Equino' },
];

const animalSeed = [
  // ─── Admin (1 animal por especie para demo) ───
  {
    key: 'admin-bovino',
    nombre: 'Demostración',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2022-06-15',
    peso: 750,
    color: 'Negro',
    identificador: 'BOV-ADM-001',
    notas: 'Animal de demostración del admin',
    propietario: 'admin',
  },
  {
    key: 'admin-ovino',
    nombre: 'Lana',
    especie: 'Ovino',
    raza: 'Merino',
    sexo: 'hembra',
    fechaNacimiento: '2023-02-10',
    peso: 60,
    color: 'Blanco',
    identificador: 'OVI-ADM-001',
    notas: 'Oveja de demostración',
    propietario: 'admin',
  },
  {
    key: 'admin-caprino',
    nombre: 'Cabra',
    especie: 'Caprino',
    raza: 'Boer',
    sexo: 'hembra',
    fechaNacimiento: '2022-11-20',
    peso: 65,
    color: 'Rojo y blanco',
    identificador: 'CAP-ADM-001',
    notas: 'Cabra de demostración',
    propietario: 'admin',
  },
  {
    key: 'admin-porcino',
    nombre: 'Tocino',
    especie: 'Porcino',
    raza: 'Duroc',
    sexo: 'macho',
    fechaNacimiento: '2022-07-30',
    peso: 280,
    color: 'Rojo',
    identificador: 'POR-ADM-001',
    notas: 'Verraco de demostración',
    propietario: 'admin',
  },
  {
    key: 'admin-equino',
    nombre: 'Relámpago',
    especie: 'Equino',
    raza: 'Cuarto de Milla',
    sexo: 'macho',
    fechaNacimiento: '2020-12-01',
    peso: 480,
    color: 'Overo',
    identificador: 'EQU-ADM-001',
    notas: 'Caballo de demostración',
    propietario: 'admin',
    active: false,
  },

  // ─── Juan Ganadero — Línea Angus (6 animales, 3 generaciones) ───
  {
    key: 'juan-toruno',
    nombre: 'Toruno',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2016-03-10',
    peso: 820,
    color: 'Negro',
    identificador: 'BOV-J-001',
    notas: 'Toro fundador de la línea Angus de Juan',
    propietario: 'juan',
  },
  {
    key: 'juan-vaquita',
    nombre: 'Vaquita',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2017-07-18',
    peso: 580,
    color: 'Negro',
    identificador: 'BOV-J-002',
    notas: 'Vaca fundadora de la línea Angus de Juan',
    propietario: 'juan',
  },
  {
    key: 'juan-macho-jr',
    nombre: 'Macho Jr',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2020-04-12',
    peso: 780,
    color: 'Negro',
    identificador: 'BOV-J-003',
    notas: 'Hijo de Toruno y Vaquita, reproductor de segunda generación',
    propietario: 'juan',
    padre: 'juan-toruno',
    madre: 'juan-vaquita',
  },
  {
    key: 'juan-lola',
    nombre: 'Lola',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2021-01-25',
    peso: 560,
    color: 'Negro',
    identificador: 'BOV-J-004',
    notas: 'Hija de Toruno y Vaquita, madre de tercera generación',
    propietario: 'juan',
    padre: 'juan-toruno',
    madre: 'juan-vaquita',
  },
  {
    key: 'juan-ternerito',
    nombre: 'Ternerito',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2023-09-05',
    peso: 420,
    color: 'Negro',
    identificador: 'BOV-J-005',
    notas: 'Tercera generación, hijo de Macho Jr y Lola',
    propietario: 'juan',
    padre: 'juan-macho-jr',
    madre: 'juan-lola',
  },
  {
    key: 'juan-ternerita',
    nombre: 'Ternerita',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2024-03-15',
    peso: 350,
    color: 'Negro',
    identificador: 'BOV-J-006',
    notas: 'Tercera generación, hija de Macho Jr y Lola',
    propietario: 'juan',
    padre: 'juan-macho-jr',
    madre: 'juan-lola',
  },

  // ─── Juan Ganadero — Línea Hereford (4 animales, 2 generaciones) ───
  {
    key: 'juan-rojizo',
    nombre: 'Rojizo',
    especie: 'Bovino',
    raza: 'Hereford',
    sexo: 'macho',
    fechaNacimiento: '2018-05-20',
    peso: 860,
    color: 'Colorado',
    identificador: 'BOV-J-007',
    notas: 'Toro fundador de la línea Hereford de Juan',
    propietario: 'juan',
  },
  {
    key: 'juan-manchada',
    nombre: 'Manchada',
    especie: 'Bovino',
    raza: 'Hereford',
    sexo: 'hembra',
    fechaNacimiento: '2018-11-03',
    peso: 600,
    color: 'Colorado y blanco',
    identificador: 'BOV-J-008',
    notas: 'Vaca fundadora de la línea Hereford de Juan',
    propietario: 'juan',
  },
  {
    key: 'juan-herefiel',
    nombre: 'Herefiel',
    especie: 'Bovino',
    raza: 'Hereford',
    sexo: 'macho',
    fechaNacimiento: '2021-06-14',
    peso: 740,
    color: 'Colorado',
    identificador: 'BOV-J-009',
    notas: 'Hijo de Rojizo y Manchada, reproductor Hereford de segunda generación',
    propietario: 'juan',
    padre: 'juan-rojizo',
    madre: 'juan-manchada',
  },
  {
    key: 'juan-rosada',
    nombre: 'Rosada',
    especie: 'Bovino',
    raza: 'Hereford',
    sexo: 'hembra',
    fechaNacimiento: '2022-02-28',
    peso: 540,
    color: 'Colorado y blanco',
    identificador: 'BOV-J-010',
    notas: 'Hija de Rojizo y Manchada, vaquillona de reemplazo',
    propietario: 'juan',
    padre: 'juan-rojizo',
    madre: 'juan-manchada',
  },

  // ─── Maria Criadora — Línea Holstein (4 animales, 2 generaciones) ───
  {
    key: 'maria-blanco',
    nombre: 'Blanco',
    especie: 'Bovino',
    raza: 'Holstein',
    sexo: 'macho',
    fechaNacimiento: '2017-01-30',
    peso: 900,
    color: 'Blanco',
    identificador: 'BOV-M-001',
    notas: 'Toro fundador de la línea lechera Holstein de María',
    propietario: 'maria',
  },
  {
    key: 'maria-negrita',
    nombre: 'Negrita',
    especie: 'Bovino',
    raza: 'Holstein',
    sexo: 'hembra',
    fechaNacimiento: '2018-04-15',
    peso: 650,
    color: 'Negro y blanco',
    identificador: 'BOV-M-002',
    notas: 'Vaca fundadora de la línea lechera Holstein de María',
    propietario: 'maria',
  },
  {
    key: 'maria-lechero',
    nombre: 'Lechero',
    especie: 'Bovino',
    raza: 'Holstein',
    sexo: 'macho',
    fechaNacimiento: '2021-08-22',
    peso: 820,
    color: 'Blanco',
    identificador: 'BOV-M-003',
    notas: 'Hijo de Blanco y Negrita, reproductor lechero de segunda generación',
    propietario: 'maria',
    padre: 'maria-blanco',
    madre: 'maria-negrita',
  },
  {
    key: 'maria-lechera',
    nombre: 'Lechera',
    especie: 'Bovino',
    raza: 'Holstein',
    sexo: 'hembra',
    fechaNacimiento: '2022-03-10',
    peso: 620,
    color: 'Negro y blanco',
    identificador: 'BOV-M-004',
    notas: 'Hija de Blanco y Negrita, vaca lechera de segunda generación',
    propietario: 'maria',
    padre: 'maria-blanco',
    madre: 'maria-negrita',
  },

  // ─── Maria Criadora — Línea Angus (6 animales, 3 generaciones) ───
  {
    key: 'maria-oscuro',
    nombre: 'Oscuro',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2016-09-12',
    peso: 800,
    color: 'Negro',
    identificador: 'BOV-M-005',
    notas: 'Toro fundador de la línea Angus de María',
    propietario: 'maria',
  },
  {
    key: 'maria-clarita',
    nombre: 'Clarita',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2017-12-05',
    peso: 570,
    color: 'Negro',
    identificador: 'BOV-M-006',
    notas: 'Vaca fundadora de la línea Angus de María',
    propietario: 'maria',
  },
  {
    key: 'maria-angusito',
    nombre: 'Angusito',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2020-10-18',
    peso: 760,
    color: 'Negro',
    identificador: 'BOV-M-007',
    notas: 'Hijo de Oscuro y Clarita, reproductor de segunda generación',
    propietario: 'maria',
    padre: 'maria-oscuro',
    madre: 'maria-clarita',
  },
  {
    key: 'maria-manchita',
    nombre: 'Manchita',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2021-06-30',
    peso: 550,
    color: 'Negro',
    identificador: 'BOV-M-008',
    notas: 'Hija de Oscuro y Clarita, vientre de segunda generación',
    propietario: 'maria',
    padre: 'maria-oscuro',
    madre: 'maria-clarita',
  },
  {
    key: 'maria-campeon',
    nombre: 'Campeón',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2024-01-20',
    peso: 400,
    color: 'Negro',
    identificador: 'BOV-M-009',
    notas: 'Tercera generación, hijo de Angusito y Manchita, promesa de la línea',
    propietario: 'maria',
    padre: 'maria-angusito',
    madre: 'maria-manchita',
  },
  {
    key: 'maria-estrella',
    nombre: 'Estrella',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2024-07-10',
    peso: 320,
    color: 'Negro',
    identificador: 'BOV-M-010',
    notas: 'Tercera generación, hija de Angusito y Manchita, vaquillona de futuro',
    propietario: 'maria',
    padre: 'maria-angusito',
    madre: 'maria-manchita',
  },
];

const resetDatabase = async () => {
  await Promise.all([
    Animal.deleteMany({}),
    Raza.deleteMany({}),
    Especie.deleteMany({}),
    Usuario.deleteMany({}),
  ]);
};

const run = async () => {
  await connectDB();

  console.log('Limpiando colecciones existentes...');
  await resetDatabase();

  console.log('Creando usuarios...');
  const createdUsers = await Usuario.create(usersSeed);
  const usersByKey = {
    admin: createdUsers[0],
    juan: createdUsers[1],
    maria: createdUsers[2],
  };

  console.log('Creando especies...');
  const createdSpecies = await Especie.create(speciesSeed);
  const speciesByName = Object.fromEntries(createdSpecies.map((species) => [species.nombre, species]));

  console.log('Creando razas...');
  const createdBreeds = await Raza.create(
    breedSeed.map((breed) => ({
      nombre: breed.nombre,
      descripcion: breed.descripcion,
      especie: speciesByName[breed.especie]._id,
    }))
  );
  const breedsByName = Object.fromEntries(createdBreeds.map((breed) => [breed.nombre, breed]));

  console.log('Creando animales...');
  const animalsByKey = {};

  for (const item of animalSeed) {
    const especie = speciesByName[item.especie];
    const raza = breedsByName[item.raza];
    const propietario = usersByKey[item.propietario];

    const animal = await Animal.create({
      nombre: item.nombre,
      especie: { _id: especie._id, nombre: especie.nombre },
      raza: { _id: raza._id, nombre: raza.nombre },
      sexo: item.sexo,
      fechaNacimiento: item.fechaNacimiento,
      peso: item.peso,
      color: item.color,
      identificador: item.identificador,
      fotoUrl: item.fotoUrl,
      notas: item.notas,
      propietario: { _id: propietario._id, nombre: propietario.nombre, email: propietario.email },
      padre: item.padre ? animalsByKey[item.padre]._id : null,
      madre: item.madre ? animalsByKey[item.madre]._id : null,
      active: item.active !== undefined ? item.active : true,
    });

    animalsByKey[item.key] = animal;
  }

  console.log('Actualizando cantidadHijos y cantidadAnimales...');
  for (const item of animalSeed) {
    if (item.padre) {
      await Animal.findByIdAndUpdate(animalsByKey[item.padre]._id, { $inc: { cantidadHijos: 1 } });
    }
    if (item.madre) {
      await Animal.findByIdAndUpdate(animalsByKey[item.madre]._id, { $inc: { cantidadHijos: 1 } });
    }
    const raza = breedsByName[item.raza];
    const especie = speciesByName[item.especie];
    await Especie.findByIdAndUpdate(especie._id, { $inc: { cantidadAnimales: 1 } });
    await Raza.findByIdAndUpdate(raza._id, { $inc: { cantidadAnimales: 1 } });
  }

  console.log('\nSeed completado con exito.');
  console.log('Usuarios de prueba:');
  console.log(`- Admin:    ${usersByKey.admin.email} / Admin123!`);
  console.log(`- Juan:     ${usersByKey.juan.email} / User123!`);
  console.log(`- Maria:    ${usersByKey.maria.email} / User123!`);
  console.log(`Especies insertadas: ${createdSpecies.length}`);
  console.log(`Razas insertadas: ${createdBreeds.length}`);
  console.log(`Animales insertados: ${Object.keys(animalsByKey).length}`);
};

run()
  .catch((error) => {
    console.error('Error al ejecutar el seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
