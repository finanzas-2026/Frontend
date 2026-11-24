# Persisted codes and display labels

Angular and Spring share closed vocabularies for the values below. PostgreSQL and the backend enforce these values; Angular displays translated labels.

| Attribute | Allowed values |
| --- | --- |
| Account role | `SUPER_ADMIN`, `STORE_ADMIN`, `CUSTOMER` |
| Store status | `ACTIVE`, `INACTIVE`, `SUSPENDED` |
| Product status | `AVAILABLE`, `OUT_OF_STOCK`, `DISCONTINUED` |
| Product unit | `KG`, `LITER`, `UNIT`, `PACK`, `BAG` |
| Customer currency | `PEN` |
| Rate type | `NOMINAL`, `EFFECTIVE` |
| Rate reference period | 1, 15, 30 or 360 commercial days |
| Nominal capitalization period | 1, 7, 15, 30, 60, 90, 180 or 360 commercial days |
| Sale payment mode | `CASH`, `MONTH_END`, `INSTALLMENTS` |
| Collection method | `CASH`, `BANK_TRANSFER`, `YAPE` |

Compensatory and penalty rates store their original fraction and reference period independently. For example, a nominal annual 24% rate with monthly capitalization stores `0.24` as its value, `360` as its reference period and `30` as its capitalization period. Effective rates store a null capitalization period.
