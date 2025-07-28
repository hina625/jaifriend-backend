const Address = require('../models/address');

// Get all addresses for a user
exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const addresses = await Address.find({ userId }).sort({ createdAt: -1 });
    
    res.json(addresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

// Add new address
exports.addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, country, city, zipCode, address, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany(
        { userId },
        { isDefault: false }
      );
    }

    const newAddress = new Address({
      userId,
      name: name.trim(),
      phone: phone || '',
      country: country || '',
      city: city || '',
      zipCode: zipCode || '',
      address: address || '',
      isDefault: isDefault || false
    });

    const savedAddress = await newAddress.save();
    
    res.status(201).json({
      message: 'Address added successfully',
      address: savedAddress
    });
  } catch (error) {
    console.error('Error adding address:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;
    const { name, phone, country, city, zipCode, address, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Check if address belongs to user
    const existingAddress = await Address.findOne({ _id: addressId, userId });
    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany(
        { userId, _id: { $ne: addressId } },
        { isDefault: false }
      );
    }

    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      {
        name: name.trim(),
        phone: phone || '',
        country: country || '',
        city: city || '',
        zipCode: zipCode || '',
        address: address || '',
        isDefault: isDefault || false
      },
      { new: true }
    );

    res.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });
  } catch (error) {
    console.error('Error updating address:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Check if address belongs to user
    const existingAddress = await Address.findOne({ _id: addressId, userId });
    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    await Address.findByIdAndDelete(addressId);

    res.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
};

// Set default address
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { addressId } = req.params;

    // Check if address belongs to user
    const existingAddress = await Address.findOne({ _id: addressId, userId });
    if (!existingAddress) {
      return res.status(404).json({ error: 'Address not found' });
    }

    // Unset all default addresses
    await Address.updateMany(
      { userId },
      { isDefault: false }
    );

    // Set this address as default
    const updatedAddress = await Address.findByIdAndUpdate(
      addressId,
      { isDefault: true },
      { new: true }
    );

    res.json({
      message: 'Default address set successfully',
      address: updatedAddress
    });
  } catch (error) {
    console.error('Error setting default address:', error);
    res.status(500).json({ error: 'Failed to set default address' });
  }
}; 