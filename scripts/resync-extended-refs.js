const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Animal = require('../models/Animal');
const Especie = require('../models/Especie');
const Raza = require('../models/Raza');
const Usuario = require('../models/Usuario');

async function resyncExtendedRefs() {
  await connectDB();

  console.log('Sincronizando referencias embebidas en Animal...');

  const especies = await Especie.find();
  const especiesMap = {};
  for (const e of especies) {
    especiesMap[e._id.toString()] = e.nombre;
  }

  const razas = await Raza.find();
  const razasMap = {};
  for (const r of razas) {
    razasMap[r._id.toString()] = r.nombre;
  }

  const usuarios = await Usuario.find();
  const usuariosMap = {};
  for (const u of usuarios) {
    usuariosMap[u._id.toString()] = { nombre: u.nombre, email: u.email };
  }

  const animals = await Animal.find();

  for (const animal of animals) {
    const update = {};

    if (animal.especie && !animal.especie.nombre) {
      const especieNombre = especiesMap[animal.especie.toString()];
      if (especieNombre) {
        update['especie.nombre'] = especieNombre;
        update['especie._id'] = animal.especie._id || animal.especie;
        update.especie = { _id: animal.especie._id || animal.especie, nombre: especieNombre };
      }
    }

    if (animal.raza && !animal.raza.nombre) {
      const razaNombre = razasMap[animal.raza.toString()];
      if (razaNombre) {
        update['raza.nombre'] = razaNombre;
        update['raza._id'] = animal.raza._id || animal.raza;
        update.raza = { _id: animal.raza._id || animal.raza, nombre: razaNombre };
      }
    }

    if (animal.propietario && !animal.propietario.nombre) {
      const user = usuariosMap[animal.propietario.toString()];
      if (user) {
        update.propietario = { _id: animal.propietario._id || animal.propietario, nombre: user.nombre, email: user.email };
      }
    }

    if (Object.keys(update).length > 0) {
      await Animal.findByIdAndUpdate(animal._id, update);
      console.log(`Actualizado animal ${animal._id} - ${animal.nombre}`);
    }
  }

  const cantidadHijos = await Animal.aggregate([
    { $match: { active: true } },
    { $group: { _id: null, total: { $sum: '$cantidadHijos' } } },
  ]);
  console.log(`Total cantidadHijos acumulado: ${cantidadHijos[0]?.total || 0}`);

  const totalEspecies = await Especie.countDocuments({ active: true });
  const totalRazas = await Raza.countDocuments({ active: true });
  console.log(`Especies activas: ${totalEspecies}, Razas activas: ${totalRazas}`);

  console.log('\nMigracion completada.');
}

resyncExtendedRefs()
  .catch((error) => {
    console.error('Error en migracion:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
