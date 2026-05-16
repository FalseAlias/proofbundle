.PHONY: all coq lean z3 clean

all: coq lean z3

coq:
	cd coq && $(MAKE) -f Makefile.coq

lean:
	cd lean && lake build

z3:
	cd z3 && z3 -smt2 suppression_continuation_guard.smt2

clean:
	cd coq && $(MAKE) -f Makefile.coq clean
	cd lean && lake clean
