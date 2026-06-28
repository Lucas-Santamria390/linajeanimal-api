#!/usr/bin/env node

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Usuario = require('./models/Usuario');
const Especie = require('./models/Especie');
const Raza = require('./models/Raza');
const Animal = require('./models/Animal');

const speciesSeed = [
  { nombre: 'Perro', descripcion: 'Especie canina de prueba' },
  { nombre: 'Gato', descripcion: 'Especie felina de prueba' },
  { nombre: 'Caballo', descripcion: 'Especie equina de prueba' },
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
  { nombre: 'Labrador Retriever', descripcion: 'Raza amigable y versatil', especie: 'Perro' },
  { nombre: 'Pastor Alemán', descripcion: 'Raza de trabajo y guardia', especie: 'Perro' },
  { nombre: 'Persa', descripcion: 'Raza felina de pelo largo', especie: 'Gato' },
  { nombre: 'Siamés', descripcion: 'Raza felina elegante y vocal', especie: 'Gato' },
  { nombre: 'Árabe', descripcion: 'Raza ecuestre resistente y agil', especie: 'Caballo' },
  { nombre: 'Pura Sangre', descripcion: 'Raza ecuestre veloz y atlética', especie: 'Caballo' },
];

const animalSeed = [
  {
    key: 'rocco',
    nombre: 'Rocco',
    especie: 'Perro',
    raza: 'Labrador Retriever',
    sexo: 'macho',
    fechaNacimiento: '2019-02-10',
    peso: 31.4,
    color: 'Dorado',
    identificador: 'DOG-0001',
    fotoUrl: 'https://example.com/animals/rocco.jpg',
    notas: 'Padre de la linea principal',
    propietario: 'admin',
  },
  {
    key: 'duna',
    nombre: 'Duna',
    especie: 'Perro',
    raza: 'Labrador Retriever',
    sexo: 'hembra',
    fechaNacimiento: '2019-05-22',
    peso: 28.1,
    color: 'Crema',
    identificador: 'DOG-0002',
    fotoUrl: 'https://example.com/animals/duna.jpg',
    notas: 'Madre de la linea principal',
    propietario: 'user',
  },
  {
    key: 'max',
    nombre: 'Max',
    especie: 'Perro',
    raza: 'Pastor Alemán',
    sexo: 'macho',
    fechaNacimiento: '2018-11-03',
    peso: 36.2,
    color: 'Negro y fuego',
    identificador: 'DOG-0003',
    fotoUrl: 'https://example.com/animals/max.jpg',
    notas: 'Segundo abuelo paterno',
    propietario: 'admin',
  },
  {
    key: 'lola',
    nombre: 'Lola',
    especie: 'Perro',
    raza: 'Pastor Alemán',
    sexo: 'hembra',
    fechaNacimiento: '2019-01-17',
    peso: 30.6,
    color: 'Negro y fuego',
    identificador: 'DOG-0004',
    fotoUrl: 'https://example.com/animals/lola.jpg',
    notas: 'Segunda abuela paterna',
    propietario: 'user',
  },
  {
    key: 'kira',
    nombre: 'Kira',
    especie: 'Perro',
    raza: 'Labrador Retriever',
    sexo: 'hembra',
    fechaNacimiento: '2021-04-12',
    peso: 27.8,
    color: 'Dorado',
    identificador: 'DOG-0005',
    fotoUrl: 'https://example.com/animals/kira.jpg',
    notas: 'Hija de Rocco y Duna',
    propietario: 'user',
    padre: 'rocco',
    madre: 'duna',
  },
  {
    key: 'toby',
    nombre: 'Toby',
    especie: 'Perro',
    raza: 'Pastor Alemán',
    sexo: 'macho',
    fechaNacimiento: '2021-08-09',
    peso: 33.9,
    color: 'Negro y fuego',
    identificador: 'DOG-0006',
    fotoUrl: 'https://example.com/animals/toby.jpg',
    notas: 'Hijo de Max y Lola',
    propietario: 'admin',
    padre: 'max',
    madre: 'lola',
  },
  {
    key: 'milo',
    nombre: 'Milo',
    especie: 'Perro',
    raza: 'Labrador Retriever',
    sexo: 'macho',
    fechaNacimiento: '2023-03-05',
    peso: 24.2,
    color: 'Crema',
    identificador: 'DOG-0007',
    fotoUrl: 'https://example.com/animals/milo.jpg',
    notas: 'Nieto de Rocco y Duna',
    propietario: 'user',
    padre: 'toby',
    madre: 'kira',
  },
  {
    key: 'nina',
    nombre: 'Nina',
    especie: 'Perro',
    raza: 'Labrador Retriever',
    sexo: 'hembra',
    fechaNacimiento: '2023-06-18',
    peso: 23.6,
    color: 'Dorado',
    identificador: 'DOG-0008',
    fotoUrl: 'https://example.com/animals/nina.jpg',
    notas: 'Nieta de Rocco y Duna',
    propietario: 'user',
    padre: 'toby',
    madre: 'kira',
  },
  {
    key: 'polo',
    nombre: 'Polo',
    especie: 'Perro',
    raza: 'Labrador Retriever',
    sexo: 'macho',
    fechaNacimiento: '2024-02-14',
    peso: 20.9,
    color: 'Dorado',
    identificador: 'DOG-0009',
    fotoUrl: 'https://example.com/animals/polo.jpg',
    notas: 'Tercer cachorro de la linea principal',
    propietario: 'admin',
    padre: 'toby',
    madre: 'kira',
  },
  {
    key: 'mishi',
    nombre: 'Mishi',
    especie: 'Gato',
    raza: 'Persa',
    sexo: 'hembra',
    fechaNacimiento: '2022-09-01',
    peso: 4.6,
    color: 'Blanco',
    identificador: 'CAT-0001',
    fotoUrl: 'https://example.com/animals/mishi.jpg',
    notas: 'Ejemplo de animal inactivo',
    propietario: 'user',
    active: false,
  },
  {
    key: 'canelo',
    nombre: 'Canelo',
    especie: 'Caballo',
    raza: 'Árabe',
    sexo: 'macho',
    fechaNacimiento: '2020-07-27',
    peso: 410.5,
    color: 'Castaño',
    identificador: 'HOR-0001',
    fotoUrl: 'https://example.com/animals/canelo.jpg',
    notas: 'Caballo de ejemplo',
    propietario: 'admin',
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
