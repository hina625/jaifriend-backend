const Event = require('../models/event');

exports.createEvent = async (req, res) => {
  try {
    const {
      eventName,
      eventDescription,
      location,
      startDate,
      startTime,
      endDate,
      endTime
    } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!eventName || !eventDescription || !location || !startDate || !startTime || !endDate || !endTime) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const event = new Event({
      eventName,
      eventDescription,
      location,
      image,
      startDate,
      startTime,
      endDate,
      endTime
    });

    await event.save();

    // Send image URL in response
    const imageUrl = image ? `${req.protocol}://${req.get('host')}/uploads/${image}` : null;
    res.status(201).json({ ...event.toObject(), imageUrl });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    const eventsWithImageUrl = events.map(event => ({
      ...event.toObject(),
      imageUrl: event.image ? `${req.protocol}://${req.get('host')}/uploads/${event.image}` : null
    }));
    res.json(eventsWithImageUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const update = req.body;
    if (req.file) update.image = req.file.filename;
    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const imageUrl = event.image ? `${req.protocol}://${req.get('host')}/uploads/${event.image}` : null;
    res.json({ ...event.toObject(), imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 