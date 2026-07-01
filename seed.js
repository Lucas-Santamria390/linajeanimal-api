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
    nombre: 'Usuario Demo',
    email: 'usuario@linajeanimal.test',
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
  {
    key: 'don-jose',
    nombre: 'Don José',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2016-03-15',
    peso: 820,
    color: 'Negro',
    identificador: 'BOV-0001',
    fotoUrl: 'https://example.com/animales/don-jose.jpg',
    notas: 'Reproductor principal, toro fundador de la linea',
    propietario: 'admin',
  },
  {
    key: 'pamela',
    nombre: 'Pamela',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2017-07-22',
    peso: 580,
    color: 'Negro',
    identificador: 'BOV-0002',
    fotoUrl: 'https://example.com/animales/pamela.jpg',
    notas: 'Vaca matriz de la linea principal',
    propietario: 'admin',
  },
  {
    key: 'ringo',
    nombre: 'Ringo',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2015-11-08',
    peso: 790,
    color: 'Negro',
    identificador: 'BOV-0003',
    fotoUrl: 'https://example.com/animales/ringo.jpg',
    notas: 'Segundo reproductor, abuelo materno',
    propietario: 'user',
  },
  {
    key: 'bety',
    nombre: 'Bety',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2016-09-14',
    peso: 560,
    color: 'Negro',
    identificador: 'BOV-0004',
    fotoUrl: 'https://example.com/animales/bety.jpg',
    notas: 'Vaca abuela materna',
    propietario: 'user',
  },
  {
    key: 'don-carlos',
    nombre: 'Don Carlos',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2019-05-20',
    peso: 850,
    color: 'Negro',
    identificador: 'BOV-0005',
    fotoUrl: 'https://example.com/animales/don-carlos.jpg',
    notas: 'Hijo de Don Jose y Pamela, padre de la generacion actual',
    propietario: 'admin',
    padre: 'don-jose',
    madre: 'pamela',
  },
  {
    key: 'rosita',
    nombre: 'Rosita',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2019-08-12',
    peso: 590,
    color: 'Negro',
    identificador: 'BOV-0006',
    fotoUrl: 'https://example.com/animales/rosita.jpg',
    notas: 'Hija de Ringo y Bety, madre de la generacion actual',
    propietario: 'user',
    padre: 'ringo',
    madre: 'bety',
  },
  {
    key: 'carlitos',
    nombre: 'Carlitos',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2022-01-30',
    peso: 720,
    color: 'Negro',
    identificador: 'BOV-0007',
    fotoUrl: 'https://example.com/animales/carlitos.jpg',
    notas: 'Toro joven con alto potencial genetico',
    propietario: 'admin',
    padre: 'don-carlos',
    madre: 'rosita',
  },
  {
    key: 'rosalia',
    nombre: 'Rosalía',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'hembra',
    fechaNacimiento: '2023-04-18',
    peso: 460,
    color: 'Negro',
    identificador: 'BOV-0008',
    fotoUrl: 'https://example.com/animales/rosalia.jpg',
    notas: 'Vaquillona de reemplazo con buenas caracteristicas',
    propietario: 'user',
    padre: 'don-carlos',
    madre: 'rosita',
  },
  {
    key: 'torito',
    nombre: 'Torito',
    especie: 'Bovino',
    raza: 'Angus',
    sexo: 'macho',
    fechaNacimiento: '2024-06-10',
    peso: 380,
    color: 'Negro',
    identificador: 'BOV-0009',
    fotoUrl: 'https://example.com/animales/torito.jpg',
    notas: 'Tercer cria de la linea principal',
    propietario: 'admin',
    padre: 'don-carlos',
    madre: 'rosita',
  },
  {
    key: 'pancracio',
    nombre: 'Pancracio',
    especie: 'Ovino',
    raza: 'Dorper',
    sexo: 'macho',
    fechaNacimiento: '2021-09-05',
    peso: 85,
    color: 'Blanco con cabeza negra',
    identificador: 'OVI-0001',
    fotoUrl: 'https://example.com/animales/pancracio.jpg',
    notas: 'Carnero reproductor Dorper puro',
    propietario: 'admin',
  },
  {
    key: 'nube',
    nombre: 'Nube',
    especie: 'Ovino',
    raza: 'Merino',
    sexo: 'hembra',
    fechaNacimiento: '2022-03-22',
    peso: 62,
    color: 'Blanco',
    identificador: 'OVI-0002',
    fotoUrl: 'https://example.com/animales/nube.jpg',
    notas: 'Oveja Merino de lana fina',
    propietario: 'user',
  },
  {
    key: 'chivita',
    nombre: 'Chivita',
    especie: 'Caprino',
    raza: 'Boer',
    sexo: 'hembra',
    fechaNacimiento: '2021-11-15',
    peso: 68,
    color: 'Rojo y blanco',
    identificador: 'CAP-0001',
    fotoUrl: 'https://example.com/animales/chivita.jpg',
    notas: 'Cabra Boer de pedigree',
    propietario: 'user',
  },
  {
    key: 'tocino',
    nombre: 'Tocino',
    especie: 'Porcino',
    raza: 'Duroc',
    sexo: 'macho',
    fechaNacimiento: '2022-07-30',
    peso: 280,
    color: 'Rojo',
    identificador: 'POR-0001',
    fotoUrl: 'https://example.com/animales/tocino.jpg',
    notas: 'Verraco Duroc de linea superior',
    propietario: 'admin',
  },
  {
    key: 'relampago',
    nombre: 'Relámpago',
    especie: 'Equino',
    raza: 'Cuarto de Milla',
    sexo: 'macho',
    fechaNacimiento: '2020-12-01',
    peso: 480,
    color: 'Overo',
    identificador: 'EQU-0001',
    fotoUrl: 'https://example.com/animales/relampago.jpg',
    notas: 'Caballo de trabajo y exposicion',
    propietario: 'admin',
    active: false,
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
    user: createdUsers[1],
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
  console.log(`- Admin: ${usersByKey.admin.email} / Admin123!`);
  console.log(`- User: ${usersByKey.user.email} / User123!`);
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
