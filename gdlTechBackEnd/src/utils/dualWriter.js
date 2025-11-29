const PendingOperation = require('../models/sync/PendingOperation');
const mongoose = require('mongoose');

module.exports = function createDualWriter (localModel, atlasModel) {
    return {
        async create(data) {
            const localDoc = await localModel.create(data);

            try {
                await atlasModel.create(data);
            } catch (err) {
                await PendingOperation.create({
                    model: atlasModel.modelName,
                    operation: 'create',
                    payload: { ...localDoc.toObject(), _id: localDoc._id },
                    documentId: localDoc._id
                });
            }
            return localDoc;
        },

        async update (id, data) {
            const localDoc = await localModel.findByIdAndUpdate(id, data, {new: true, upsert: false});
            const _id = mongoose.Types.ObjectId(id);

            try {
                await atlasModel.findByIdAndUpdate(_id, data);
            } catch  {
                await PendingOperation.create({
                    model: atlasModel.modelName,
                    operation: 'update',
                    documentId: _id,
                    payload: data
                });
            }
            return localDoc;
        },

        async delete(id) { 
            const localDoc = await localModel.findByIdAndDelete(id);
            const _id = mongoose.Types.ObjectId(id);

            try {
                await atlasModel.findByIdAndDelete(_id);
            } catch {
                await PendingOperation.create({
                    model: atlasModel.modelName,
                    operation: 'delete',
                    documentId: _id
                });
            }
            return localDoc;
        }
    };
};
