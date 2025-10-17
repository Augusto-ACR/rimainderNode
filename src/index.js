// src/index.js
import app from './app.js';
import AppDatasource from './module/user/providers/datasource.provider.js';
import pkg from 'signale';


const { Signale } = pkg;

const main = async () => {
  const logger = new Signale({ scope: 'Main' });
  const port = app.get('port');

  try {
    await AppDatasource.initialize();
    logger.success('Connected to database');
  } catch (err) {
    logger.error(`Unable to connect to database, ${err}`);
  }

  app.listen(port, () => logger.start(`Server running on port ${port}`));
};

main();
