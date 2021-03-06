import { getCustomRepository, getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError("You don't have founds enought", 400);
    }

    const categoryRepository = getRepository(Category);

    const categoryAlreadyExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (categoryAlreadyExists) {
      const transaction = transactionRepository.create({
        title,
        value,
        type,
        category: categoryAlreadyExists,
      });
      await transactionRepository.save(transaction);

      return transaction;
    }
    const newCategory = categoryRepository.create({ title: category });
    await categoryRepository.save(newCategory);

    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category: newCategory
    });
    await transactionRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;
